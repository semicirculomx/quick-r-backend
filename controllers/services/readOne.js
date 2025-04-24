import Service from "../../models/Service.js";

async function getOne(req, res, next) {
    try {
        let service = await Service.findById(req.params.id).select('-_id  -__v').populate("category", "title -_id")
        if (service) {
            return res.status("200").json({
                success: true,
                service
            });
        }
        return res.status(404).json({
            success: false,
            message: "The service doesn't exists"
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal error"
        })
    }
    
}

export default getOne