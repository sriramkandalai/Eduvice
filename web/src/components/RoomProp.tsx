import { Marg } from "./Marg";
import { BookStool, Chalkboard, FloorLamp, SchoolDesk } from "./SceneProps";
import type { RoomTheme } from "@/lib/room-theme";

/** The prop that stands on a room's floor (end side), sized for content rooms. */
export function RoomProp({ prop }: { prop: RoomTheme["prop"] }) {
  const floorSpot = "prop-shadow parallax-slow absolute bottom-[calc(var(--floor)*0.3)] end-[5vw] hidden w-auto md:block";
  switch (prop) {
    case "lamp":
      return <FloorLamp className={`${floorSpot} h-[46vh]`} />;
    case "desk":
      return <SchoolDesk className={`${floorSpot} h-[20vh]`} />;
    case "stool":
      return <BookStool className={`${floorSpot} h-[26vh]`} />;
    case "marg":
      return <Marg state="thinking" className={`${floorSpot} h-[20vh]`} />;
    case "chalkboard":
      return <Chalkboard className="parallax-slow absolute end-[5vw] top-24 hidden h-[22vh] w-auto lg:block" />;
  }
}
