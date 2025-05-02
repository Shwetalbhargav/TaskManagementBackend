export const isAuthenticated = (req, res, next) =>{
    if (req.session.userId){
        next();
    } else {
        res.status(401).json({message:"not authenticated"});
    }
};

export const hasRole = (roles) => (req, res, next) =>{
    if(roles.includes(req.session.role)) {
        next();
    } else {
        res.status(403).json({message:"Forbidden: Insufficient privileges."});
    }
};