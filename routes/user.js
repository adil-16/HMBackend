const express = require("express");
const userController = require("../controller/user");

const uploadMiddleware = require("../middleware/uploadFile");

const userRouter = express.Router();

userRouter.post(
  "/addUser",
  uploadMiddleware.single("image"),
  userController.register
);
userRouter.post("/login", userController.login);
userRouter.put("/updateUser/:id",uploadMiddleware.single("image"), userController.editUser);
userRouter.put(
  "/editPhoto/:id",
  uploadMiddleware.single("file"),
  userController.editPhoto
);
userRouter.get("/getUsers", userController.getUsers);
userRouter.get("/getSuppliers", userController.getSuppliers);
userRouter.get("/getCustomers", userController.getCustomers);
userRouter.get("/search/:value", userController.searchUser);
userRouter.delete("/deleteUser/:id", userController.deleteUser);

module.exports = userRouter;
