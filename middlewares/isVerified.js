async function accountHasBeenVerified(req, res, next){
    if(req.user.is_verified){
        return next();
    }
    return res.status(400).json({
        success: false,
        message: [
            {
                path: "verify",
                message: "Tu cuenta aún no está verificada"
            }
        ]
    });
}
export default accountHasBeenVerified;