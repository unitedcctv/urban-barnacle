import { Global } from "@emotion/react"

import PoppinsExtraLight from "../theme/assets/Poppins-ExtraLight.ttf"
import PoppinsLight from "../theme/assets/Poppins-Light.ttf"
import PoppinsMedium from "../theme/assets/Poppins-Medium.ttf"
import PoppinsRegular from "../theme/assets/Poppins-Regular.ttf"
import PoppinsThin from "../theme/assets/Poppins-Thin.ttf"

export const Fonts = () => (
  <Global
    styles={`
      @font-face {
        font-family: 'Poppins';
        src: url(${PoppinsThin}) format('truetype');
        font-weight: 100;
        font-style: normal;
      }
      @font-face {
        font-family: 'Poppins';
        src: url(${PoppinsExtraLight}) format('truetype');
        font-weight: 200;
        font-style: normal;
      }
      @font-face {
        font-family: 'Poppins';
        src: url(${PoppinsLight}) format('truetype');
        font-weight: 300;
        font-style: normal;
      }
      @font-face {
        font-family: 'Poppins';
        src: url(${PoppinsRegular}) format('truetype');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Poppins';
        src: url(${PoppinsMedium}) format('truetype');
        font-weight: 500;
        font-style: normal;
      }
    `}
  />
)

const fonts = {
  // Use heavier weight (e.g., 500–700) for headings.
  heading: "Poppins, sans-serif",
  // Use medium or regular weight for subheadings or accent text.
  subheading: "Poppins, sans-serif",
  // Use light or regular weight for body text.
  body: "Poppins, sans-serif",
}

export default fonts
