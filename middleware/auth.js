const authMiddleware = (req, res, next)=>{
const { StatusCodes } = require("http-status-codes");

if (global.user.id===null) {

res
.status(StatusCodes.UNAUTHORIZED)
.json({'message': "unauthorized"})
}

next();

}

exports.module=authMiddleware;