import { HiBriefcase } from "react-icons/hi";
import { assets } from "../assets/assets";

export default function AuthHeader() {
  return (
    <div className="text-center mb-6">
      <img src={assets.logo} className="w-16 h-16 mx-auto mb-2 text-gray-400"  alt="" />
      <h2 className="text-2xl font-bold mb-1 text-[#003b8e]">
      Covenant Sowing
      </h2>
      <p className="text-gray-700 text-sm">
           "Mahasambatra kokoa ny manomehy noho ny mandray"
      </p>
      <p className="font-bold text-[#020406] "> Asan'ny apostoly 20 : 35</p>
    </div>
  );
}

