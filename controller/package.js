const Package = require("../models/package");
const Hotel = require("../models/hotel");

const packageController = {
  async createPackage(req, res) {
    try {
      const { packageName, hotels, validity } = req.body;

      // Validate hotels input
      for (const hotel of hotels) {
        if (!hotel.hotel || !hotel.roomRate) {
          return res.status(400).send({
            success: false,
            data: { error: "Each hotel must include hotel ID and room rate" },
          });
        }
      }

      const hotelsWithBedRates = await Promise.all(hotels.map(async (hotel) => {
        const { roomRate } = hotel;

        const totalProportions = 1 + 2 + 3 + 4 + 5;
        const bedRatesProportions = {
          single: 1 / totalProportions,
          double: 2 / totalProportions,
          triple: 3 / totalProportions,
          quatre: 4 / totalProportions,
          studio: 5 / totalProportions,
        };

        // Calculate the rate for each bed type
        const bedRates = {};
        for (const [bedType, proportion] of Object.entries(bedRatesProportions)) {
          bedRates[bedType] = roomRate * proportion;
        }

        const hotelDetails = await Hotel.findById(hotel.hotel);

        return {
          ...hotel,
          bedRates,
          hotelName: hotelDetails.name,
        };
      }));

      const newPackage = new Package({
        packageName,
        hotels: hotelsWithBedRates,
        validity,
      });

      await newPackage.save();

      // Populate hotel names for the response
      const populatedPackage = await Package.findById(newPackage._id).populate("hotels.hotel");

      return res.status(200).send({
        success: true,
        data: {
          message: "Package created successfully",
          package: populatedPackage,
        },
      });
    } catch (error) {
      console.error("Error creating package:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async getPackages(req, res) {
    try {
      const packages = await Package.find().populate("hotels.hotel");

      return res.status(200).send({
        success: true,
        data: {
          message: "Packages retrieved successfully",
          packages,
        },
      });
    } catch (error) {
      console.error("Error retrieving packages:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },


  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const package = await Package.findOne({ packageId: id }).populate("hotels.hotel");

      if (!package) {
        return res.status(404).send({
          success: false,
          data: { error: "Package not found" },
        });
      }

      // Populate hotel names
      const hotelsWithNames = package.hotels.map((hotel) => ({
        ...hotel,
        hotelName: hotel.hotel.name, // Add hotel name
      }));

      return res.status(200).send({
        success: true,
        data: {
          message: "Package retrieved successfully",
          package: {
            ...package._doc,
            hotels: hotelsWithNames,
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving package:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const { packageName, hotels, validity } = req.body;

      const hotelsWithBedRates = await Promise.all(hotels.map(async (hotel) => {
        const { roomRate } = hotel;

        const totalProportions = 1 + 2 + 3 + 4 + 5;
        const bedRatesProportions = {
          single: 1 / totalProportions,
          double: 2 / totalProportions,
          triple: 3 / totalProportions,
          quatre: 4 / totalProportions,
          studio: 5 / totalProportions,
        };

        // Calculate the rate for each bed type
        const bedRates = {};
        for (const [bedType, proportion] of Object.entries(bedRatesProportions)) {
          bedRates[bedType] = roomRate * proportion;
        }

        const hotelDetails = await Hotel.findById(hotel.hotel);

        return {
          ...hotel,
          bedRates,
          hotelName: hotelDetails.name,
        };
      }));

      const updatedPackage = await Package.findOneAndUpdate(
        { packageId: id },
        { packageName, hotels: hotelsWithBedRates, validity },
        { new: true }
      ).populate("hotels.hotel");

      if (!updatedPackage) {
        return res.status(404).send({
          success: false,
          data: { error: "Package not found" },
        });
      }

      return res.status(200).send({
        success: true,
        data: {
          message: "Package updated successfully",
          package: updatedPackage,
        },
      });
    } catch (error) {
      console.error("Error updating package:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },

  async deletePackage(req, res) {
    try {
      const { id } = req.params;

      const deletedPackage = await Package.findOneAndDelete({ packageId: id });

      if (!deletedPackage) {
        return res.status(404).send({
          success: false,
          data: { error: "Package not found" },
        });
      }

      return res.status(200).send({
        success: true,
        data: {
          message: "Package deleted successfully",
        },
      });
    } catch (error) {
      console.error("Error deleting package:", error);
      return res.status(500).send({
        success: false,
        data: { error: "Server Error" },
      });
    }
  },
};

module.exports = packageController;
