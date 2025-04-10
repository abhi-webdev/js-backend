import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
 
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
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 3. check if user already exist {with username , email}
  const existingUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw ApiError(409, "User with email or username already exist ");
  }

  // 4. check for images , cheak for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImagesLocalPath = req.files?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar file is required")
  }

  // 5. upload to cloudinary - after giving the response from cloudinary in the form of URL
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImagesLocalPath)

  if (!avatar) {
    throw new ApiError(400, " Avatar file is required")
  }

   // 6. create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  // 7. remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // 8. cheak for user creation
  if (!createdUser) {
      throw new ApiError(500, "Somtjing went wrong while registering the user")
  }
 
  // 9. return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

});

export { registerUser };
