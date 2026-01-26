import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import { prisma } from "./src/lib/prisma"
import fs from "fs"
import path from "path"
import { setSocketServer } from "./src/lib/socket-server"

const dev = process.env.NODE_ENV !== "production"
const hostname = "0.0.0.0" // Always listen on all interfaces for Docker compatibility
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true)
            
            // Do not handle socket.io requests with Next.js
            if (parsedUrl.pathname?.startsWith('/api/socket')) {
                return
            }

            if (parsedUrl.pathname?.startsWith('/uploads/')) {
                const filePath = path.join(process.cwd(), 'public', parsedUrl.pathname)
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(filePath).toLowerCase()
                    const mimeTypes: Record<string, string> = {
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.png': 'image/png',
                    }
                    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
                    fs.createReadStream(filePath).pipe(res)
                    return
                }
            }
            
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error("Error handling request:", err)
            res.statusCode = 500
            res.end("Internal server error")
        }
    })

    // Consolidated WebSocket Server on the default path
    const io = new SocketIOServer(httpServer, {
        path: "/api/socket",
        cors: {
            origin: true,
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket"],
        allowEIO3: true,
        serveClient: false,
        cookie: false
    })

    setSocketServer(io)

    io.use(async (socket, next) => {
        try {
            const sessionToken = socket.handshake.auth.sessionToken
            
            if (!sessionToken) {
                console.log("[WS-AUTH] Failed: No session token")
                return next(new Error("No session token provided"))
            }

            const session = await prisma.session.findUnique({
                where: { token: sessionToken },
                include: { user: { select: { id: true, role: true } } }
            })

            if (!session || new Date(session.expiresAt) < new Date()) {
                console.log("[WS-AUTH] Failed: Invalid or expired session")
                return next(new Error("Invalid or expired session"))
            }

            socket.data.userId = session.user.id
            socket.data.userRole = session.user.role

            console.log(`[WS-AUTH] Success for user: ${session.user.id}`)
            next()
        } catch (error) {
            console.error("Socket auth error:", error)
            next(new Error("Authentication failed"))
        }
    })

    io.on("connection", (socket) => {
        const userId = socket.data.userId
        const userRole = socket.data.userRole

        console.log(`[WS] User connected: ${userId} (${userRole})`)

        socket.join(`user:${userId}`)

        if (userRole === "STAFF") {
            socket.join("staff")
            console.log(`[WS] User ${userId} joined staff room`)
        }

        socket.on("disconnect", (reason) => {
            console.log(`[WS] User disconnected: ${userId} (${reason})`)
        })
        socket.on("ping", () => {
            socket.emit("pong")
        })
    })

    ;(async () => {
        try {
            console.log("> Starting notification queue worker...")
            const { initNotificationWorker } = await import("@/lib/queue/worker")
            initNotificationWorker(io)
            console.log("> Notification queue worker started successfully")
        } catch (error) {
            console.error("> FAILED to start notification queue worker:", error)
        }
    })()

    httpServer.listen(port, () => {
        console.log(`> Server ready on http://${hostname}:${port}`)
        console.log(`> WebSockets active on the same port`)
    })
})
