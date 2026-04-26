const { StatusCodes } = require("http-status-codes");


function register(req, res){
    const newUser = {...req.body};
    global.users.push(newUser);
    global.user_id = newUser;
    delete req.body.password;
    res.status(StatusCodes.CREATED).json(req.body);
};


function logon (req, res){
const user=global.users.find((user)=> user.email===req.body.email)
if(user&&user.password===req.body.password){
global.user_id=user;
delete user.password;
res.status(StatusCodes.OK).json(user)
}
else res.status(StatusCodes.UNAUTHORIZED).json({message:"Authentication Failed"})
}

function logoff (req, res){
global.user_id=null;
res.sendStatus(200);
}

module.exports={register,logon, logoff};