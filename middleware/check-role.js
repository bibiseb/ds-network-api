function checkRole(...allowedRoles) {
    return (req, res, next) => {
        if (req.isAuthenticated()) {
            if (allowedRoles.includes(req.user.role)) {
                return next()
            }

            return res.status(403).json({ message: 'You cannot perform this action' })
        }

        res.status(500).send()
    }
}

module.exports = checkRole;