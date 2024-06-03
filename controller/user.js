const User = require("../models/user");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userController = {
  async register(req, res) {
    try {
      const fileBuffer = req.file ? req.file.filename : null;
      let userData = req.body;
      let user = new User(userData);
      user.image = fileBuffer
      const emailExists = await User.findOne({
        email: user.email,
      });
      if (emailExists) {
        res.status(400).send({
          success: false,
          data: { error: "This user already exists" },
        });
      } else {
        if (req.body.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }

        user.save((error, registereduser) => {
          if (error) {
            res.status(400).send({
              success: false,
              data: { error: error.message },
            });
          } else {
            const token = jwt.sign(
              { _id: registereduser._id },
              process.env.TOKEN_SECRET
            );
            res.status(200).send({
              success: true,
              data: {
                message: "user added successfully",
                authToken: token,
                name: registereduser.name,
                email: registereduser.email,
                _id: registereduser._id,
              },
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },
  // ...................... login .............................
  async login(req, res) {
    try {
      const userData = req.body;
      const user = new User(userData);
      const founduser = await User.findOne({
        email: userData.email,
        isGuest: false,
        admin: true
      });

      if (!founduser) {
        res
          .status(400)
          .send({ success: false, data: { error: "user donot exists" } });
      } else {
        const validPass = await bcrypt.compare(
          user.password,
          founduser.password
        );
        if (!validPass) {
          res
            .status(400)
            .send({ success: false, data: { error: "Wrong password" } });
        } else {
          const token = jwt.sign(
            { _id: founduser._id },
            process.env.TOKEN_SECRET
          );
          res.status(200).send({
            success: true,
            data: {
              message: "logged in successfully",
              authToken: token,
              name: founduser.name,
              email: founduser.email,
              _id: founduser._id,
              image: founduser.image,
            },
          });
        }
      }
    } catch (err) {
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  //........................ edit profile photo .....................
  async editPhoto(req, res) {
    try {
      const id = req.params.id
      const fileBuffer = req.file ? req.file.filename : null;
      
     
      let user = await User.findOneAndUpdate({ _id: id }, {image: fileBuffer})
      .then((result) => {
        // Changed parameter name from res to result
        return res.status(200).send({
          success: true,
          data: {
            message: "image updated successfully",
            // authToken: token,
            name: result.name,
            email: result.email,
            _id: id,
            image: fileBuffer,
          },
        });
      })
      .catch((err) => {
        return res
          .status(400)
          .send({ success: false, data: { error: err.message } });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  // edit user
  async editUser(req, res) {
    try {
      const id = req.params.id;
      let data = req.body;
     
      if (!id) {
        return res
          .status(400)
          .send({ success: false, data: { error: "User doesn't exist" } });
      } else {
        let userExist = await User.findOne({ email: data.email });
        if (userExist && userExist._id != id) {
          return res.status(400).send({
            success: false,
            data: {
              error:
                "You cannot use this email user with this email already exists",
            },
          });
        } else {
          const salt = await bcrypt.genSalt(10);
          data.password = await bcrypt.hash(data.password, salt);
          console.log(data)
    
          let user = await User.findOneAndUpdate({ _id: id }, data)
            .then((result) => {
              // Changed parameter name from res to result
              return res.status(200).send({
                success: true,
                data: {
                  message: "user updated successfully",
                  // authToken: token,
                  name: result.name,
                  email: data.email,
                  _id: id,
                  image: result.image, },
              });
            })
            .catch((err) => {
              return res
                .status(400)
                .send({ success: false, data: { error: err.message } });
            });
        }
      }
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

   // search user
   async searchUser(req, res) {
    try {
      const value = req.params.value;

          let user = await User.find({ 
            $or: [
              { name: new RegExp(value, 'i') },
              { email: new RegExp(value, 'i') },
              { phone: new RegExp(value, 'i') },
            ],
           })
            .then((result) => {
              let users = [];
              result.map((val, ind) => {
                role = "";
                if (val.isGuest == true) {
                  role = "Guest";
                } else {
                  role = "Customer";
                }
    
    
                let userr = {
                  id: val._id,
                  name: val.name,
                  email: val.email,
                  phone: val.phone,
                  role,
                  image: val.image,
                  isSelected: false,
                };
                users.push(userr);
              });
              users.reverse()
              return res.status(200).send({
                success: true,
                data: { message: "details updated successfully", user: users },
              });
            })
            .catch((err) => {
              return res
                .status(400)
                .send({ success: false, data: { error: err.message } });
            });
     
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // get all users
  async getUsers(req, res) {
    try {
      let user = await User.find({admin: false})
        .then((result) => {
          let users = [];
          result.map((val, ind) => {
            role = "";
            if (val.isGuest == true) {
              role = "Guest";
            } else {
              role = "Customer";
            }


            let userr = {
              id: val._id,
              name: val.name,
              email: val.email,
              phone: val.phone,
              role,
              image: val.image,
              isSelected: false,
            };
            users.push(userr);
          });
          users.reverse()
          return res.status(200).send({
            success: true,
            data: { message: "details found successfully", user: users },
          });
        })
        .catch((err) => {
          return res
            .status(400)
            .send({ success: false, data: { error: err.message } });
        });
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  // delete user
  async deleteUser(req, res) {
    const _id = req.params.id;
    try {
      let user = await User.findOneAndDelete({ _id });
      if (user) {
        // Changed parameter name from res to result
        return res.status(200).send({
          success: true,
          data: { message: "User deleted successfully" },
        });
      } else {
        return res
          .status(400)
          .send({ success: false, data: { error: "User not found" } });
      }
    } catch (error) {
      // Handle any unexpected errors
      res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
};

module.exports = userController;

// router.post("/login", async (req, res) => {
// });
