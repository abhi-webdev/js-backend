import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
// import { upload } from "../middlewares/multer.middleware.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Somthing went wring while generation refresh and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation  {email, password = Empty to nahi hai na }
    // check if user already exist {with username , email}
    // check for images , cheak for avatar
    // upload to cloudinary - after giving the response from cloudinary in the form of URL
    // create user object - create entry in db
    // remove password and refresh token field from response
    // cheak for user creation
    // return response

    // 1. get user details from frontend
    const { fullname, username, email, password } = req.body;

    // 2. validation  {email, password = Empty to nahi hai na }
    if (
        [fullname, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // 3. check if user already exist {with username , email}
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exist ");
    }

    // 4. check for images , cheak for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImagesLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, " Avatar file is required");
    }

    let coverImagesLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImagesLocalPath = req.files.coverImage[0].path;
    }

    // 5. upload to cloudinary - after giving the response from cloudinary in the form of URL
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagesLocalPath);

    if (!avatar) {
        throw new ApiError(400, " Avatar file is required");
    }

    // 6. create user object - create entry in db
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
    });

    // 7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // 8. cheak for user creation
    if (!createdUser) {
        throw new ApiError(
            500,
            "Somtjing went wrong while registering the user"
        );
    }

    // 9. return response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // 1. get data from req body
    // 2. username or email
    // 3. find the user
    // 4. password check
    // 5. generate accessToken and refreshToken
    // send cookies

    // 1. get data from req body
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is not valid");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).
    select("-password -refeshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In succesfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError(401, "unauthorizedRequest")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expaires or used")
        }
    
        const options = {
            httpOnly: true, 
            secure: true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
                    .cookie("AccessToken", accessToken, options)
                    .cookie("RefreshToken", newRefreshToken, options)
                    .json(new ApiResponse (200, {
                        accessToken,
                        refreshToken: newRefreshToken, 
                        
                    }, "Access token refreshed" ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }


})




export { registerUser, loginUser, logoutUser, refreshAccessToken };
