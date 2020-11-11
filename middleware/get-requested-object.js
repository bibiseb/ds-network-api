function getRequestedObject(model, as) {
    return async function getRequestedObject(req, res, next) {
        let object

        try {
            object = await model.findById(req.params.id)

            if (object === null) {
                return res.status(404).json({message: 'Cannot find resource'})
            }
        } catch (err) {
            return res.status(500).json({message: err.message})
        }

        req[as] = object

        next()
    }
}

module.exports = getRequestedObject