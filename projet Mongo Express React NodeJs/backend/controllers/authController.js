import validator from "validator"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import authModel from "../models/authModel.js"

const createToken = (id) => {
   return jwt.sign({id},process.env.JWT_SECRET)
}

//Route for admin login
const adminLogin = async (req, res) => {
   try {
     const { email, password } = req.body;
     if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
       const token = jwt.sign({ email }, process.env.JWT_SECRET);
       res.json({ success: true, token });
     } else {
       res.json({ success: false, message: "Invalid credentials" });
     }
   } catch (error) {
     console.log(error);
     res.json({ success: false, message: error.message });
   }
 };
 

export {adminLogin}