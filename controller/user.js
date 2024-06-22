const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userController = {
  async register(req, res) {
    try {
      const fileBuffer = req.file ? req.file.filename : null;
      let userData = req.body;
      let user = new User(userData);
      user.image = fileBuffer;
  
      const emailExists = await User.findOne({ email: user.email });
      if (emailExists) {
        return res.status(400).send({
          success: false,
          data: { error: "This user already exists" },
        });
      }
  
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
  
      if (user.role === "customer" && user.customerType === "guest") {
        if (!userData.passportNumber || !userData.passengers) {
          return res.status(400).send({
            success: false,
            data: {
              error:
                "Passport number and passengers are required for guest customers",
            },
          });
        }
        user.passportNumber = userData.passportNumber;
        user.passengers = JSON.parse(userData.passengers);
      }
  
      await user.save();
      const token = jwt.sign(
        { _id: user._id, role: user.role },
        process.env.TOKEN_SECRET
      );
      return res.status(200).send({
        success: true,
        data: {
          message: "User added successfully",
          authToken: token,
          name: user.name,
          email: user.email,
          _id: user._id,
          gender: user.gender,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .send({ success: false, data: { error: "User does not exist" } });
      }

      const validPass = await bcrypt.compare(password, user.password);
      if (!validPass) {
        return res
          .status(400)
          .send({ success: false, data: { error: "Wrong password" } });
      }

      const token = jwt.sign(
        { _id: user._id, role: user.role },
        process.env.TOKEN_SECRET
      );
      return res.status(200).send({
        success: true,
        data: {
          message: "Logged in successfully",
          authToken: token,
          name: user.name,
          email: user.email,
          _id: user._id,
          image: user.image,
        },
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  async editPhoto(req, res) {
    try {
      const id = req.params.id;
      const fileBuffer = req.file ? req.file.filename : null;

      let user = await User.findOneAndUpdate(
        { _id: id },
        { image: fileBuffer },
        { new: true }
      );
      if (user) {
        return res.status(200).send({
          success: true,
          data: {
            message: "Image updated successfully",
            name: user.name,
            email: user.email,
            _id: id,
            image: fileBuffer,
          },
        });
      } else {
        return res
          .status(400)
          .send({ success: false, data: { error: "User not found" } });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send({
        success: false,
        data: { error: "Some Error Occurred" },
      });
    }
  },

  async editUser(req, res) {
    try {
      const fileBuffer = req.file ? req.file.filename : null;
      const id = req.params.id;
      let data = req.body;

      let userExist = await User.findById(id);
      if (!userExist) {
        return res.status(400).send({
          success: false,
          data: { error: "User doesn't exist" },
        });
      }

      let emailExist = await User.findOne({ email: data.email });
      if (emailExist && emailExist._id.toString() !== id) {
        return res.status(400).send({
          success: false,
          data: { error: "Email already in use by another user" },
        });
      }

      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);
      } else {
        delete data.password;
      }

      if (fileBuffer) {
        data.image = fileBuffer;
      }

      // Parse passengers array correctly if it's a string
      if (typeof data.passengers === "string") {
        try {
          data.passengers = JSON.parse(data.passengers);
        } catch (error) {
          console.error("Error parsing passengers:", error);
          return res.status(400).send({
            success: false,
            data: { error: "Invalid passengers format" },
          });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
      return res.status(200).send({
        success: true,
        data: {
          message: "User updated successfully",
          name: updatedUser.name,
          email: updatedUser.email,
          _id: id,
          image: updatedUser.image,
          gender: updatedUser.gender,
        },
      });
    } catch (error) {
      console.error("Error in editUser:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async searchUser(req, res) {
    try {
      const value = req.params.value;

      let users = await User.find({
        $or: [
          { name: new RegExp(value, "i") },
          { email: new RegExp(value, "i") },
          { phone: new RegExp(value, "i") },
        ],
      });

      let userList = users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        customerType: user.customerType || "",
        image: user.image,
        isSelected: false,
      }));

      return res.status(200).send({
        success: true,
        data: { message: "Details updated successfully", user: userList },
      });
    } catch (error) {
      console.error("Error in searchUser:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async getUsers(req, res) {
    try {
      let users = await User.find({ role: { $ne: "admin" } });

      let userList = users.map((user) => {
        let userData = {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          customerType: user.customerType || "",
          image: user.image,
          isSelected: false,
        };

        if (user.role === "customer" && user.customerType === "guest") {
          userData.passportNumber = user.passportNumber || "";
          userData.passengers = user.passengers || [];
        }

        return userData;
      });

      return res.status(200).send({
        success: true,
        data: { message: "Details found successfully", user: userList },
      });
    } catch (error) {
      console.error("Error in getUsers:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async getSuppliers(req, res) {
    try {
      const suppliers = await User.find({ role: "supplier" });

      let supplierList = suppliers.map((supplier) => ({
        id: supplier._id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        role: supplier.role,
        image: supplier.image,
        isSelected: false,
      }));

      return res.status(200).send({
        success: true,
        data: {
          message: "Suppliers found successfully",
          suppliers: supplierList,
        },
      });
    } catch (error) {
      console.error("Error in getSuppliers:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async getCustomers(req, res) {
    try {
      const customers = await User.find({ role: "customer" });

      let customerList = customers.map((customer) => ({
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        customerType: customer.customerType || "",
        image: customer.image,
        isSelected: false,
        passportNumber:
          customer.customerType === "guest"
            ? customer.passportNumber
            : undefined,
        passengers:
          customer.customerType === "guest" ? customer.passengers : undefined,
      }));

      return res.status(200).send({
        success: true,
        data: {
          message: "Customers found successfully",
          customers: customerList,
        },
      });
    } catch (error) {
      console.error("Error in getCustomers:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async deleteUser(req, res) {
    const _id = req.params.id;
    try {
      let user = await User.findOneAndDelete({ _id });
      if (user) {
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
      console.error("Error in deleteUser:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
};

module.exports = userController;
