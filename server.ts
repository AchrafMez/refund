import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import { prisma } from "./src/lib/prisma"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)
const wsPort = parseInt(process.env.WS_PORT || "5000", 10)

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Global Socket.IO instance for use in server actions
declare global {
    var io: SocketIOServer | undefined
}

app.prepare().then(() => {
    // Create HTTP server for Next.js
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true)
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error("Error handling request:", err)
            res.statusCode = 500
            res.end("Internal server error")
        }
    })

    // Create separate WebSocket server on port 5000
    const wsHttpServer = createServer()
    const io = new SocketIOServer(wsHttpServer, {
        cors: {
            origin: [`http://localhost:${port}`, `http://${hostname}:${port}`],
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    })

    // Store io globally for server actions to use
    global.io = io

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const sessionToken = socket.handshake.auth.sessionToken
            
            if (!sessionToken) {
                return next(new Error("No session token provided"))
            }

            // Verify session with database
            const session = await prisma.session.findUnique({
                where: { token: sessionToken },
                include: { user: { select: { id: true, role: true } } }
            })

            if (!session || new Date(session.expiresAt) < new Date()) {
                return next(new Error("Invalid or expired session"))
            }

            // Attach user info to socket
            socket.data.userId = session.user.id
            socket.data.userRole = session.user.role

            next()
        } catch (error) {
            console.error("Socket auth error:", error)
            next(new Error("Authentication failed"))
        }
    })

    // Connection handling
    io.on("connection", (socket) => {
        const userId = socket.data.userId
        const userRole = socket.data.userRole

        console.log(`[WS] User connected: ${userId} (${userRole})`)

        // Join personal room
        socket.join(`user:${userId}`)

        // Staff/Admin join staff room for broadcasts
        if (userRole === "STAFF" || userRole === "ADMIN") {
            socket.join("staff")
            console.log(`[WS] User ${userId} joined staff room`)
        }

        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`[WS] User disconnected: ${userId} (${reason})`)
        })

        // Ping/pong for connection health
        socket.on("ping", () => {
            socket.emit("pong")
        })
    })

    // Initialize notification queue worker (async IIFE)
    ;(async () => {
        try {
            console.log("> Starting notification queue worker...")
            // Use precise path validation
            const { initNotificationWorker } = await import("@/lib/queue/worker")
            initNotificationWorker(io)
            console.log("> Notification queue worker started successfully")
        } catch (error) {
            console.error("> FAILED to start notification queue worker:", error)
            console.warn("> Redis might not be available or build issue. Direct emit will be used.")
        }
    })()

    // Start servers
    httpServer.listen(port, () => {
        console.log(`> Next.js ready on http://${hostname}:${port}`)
    })

    wsHttpServer.listen(wsPort, () => {
        console.log(`> WebSocket server ready on ws://${hostname}:${wsPort}`)
    })
})
