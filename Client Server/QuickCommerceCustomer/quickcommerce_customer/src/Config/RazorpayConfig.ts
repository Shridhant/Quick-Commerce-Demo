import Razorpay from "razorpay";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "./SettingReader";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID as string,
  key_secret: RAZORPAY_KEY_SECRET as string,
});

export default razorpay;