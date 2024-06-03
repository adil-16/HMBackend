const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assuming you want to store files in the 'public' folder
        const uploadDir = path.join(__dirname, '../public/');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace(/:/g, '-').split('.')[0];
        cb(null, formattedDate + "-" + fileName);
    }
    
    
});

const uploadMiddleware = multer({
    storage: storage
});
module.exports = uploadMiddleware;
