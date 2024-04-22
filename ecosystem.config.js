module.exports = {
    apps : [{
        name: "soloscribe-web-app",
        script: "server/server.py",
        interpreter: "python",
        watch: true,
        restart_delay: 5000
    }]
}