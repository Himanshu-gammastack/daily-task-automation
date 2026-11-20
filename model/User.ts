
import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  data?: IData;
}

export interface IData {
  accessToken?: string;
  refreshToken?: string;
  accountsId?: string;
  location?: string; 
}

const DataSchema = new Schema<IData>({
  accessToken: { 
    type: String 
  },
  refreshToken: { 
    type: String 
  },
  accountsId: { 
    type: String 
  },
  location: { 
    type: String, 
    default: "in" 
  },
});


const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    data:{
      type: DataSchema
    }
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
