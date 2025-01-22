import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { itemsReadItems } from "../../client/sdk.gen.ts"
import { images_url } from "../../utils";

export const Route = createFileRoute("/_layout/")({
    component: Home,
})

const ITEM_COUNT = 5

function getItemsQueryOptions() {
  return {
    queryFn: () => itemsReadItems({ skip: 0, limit: ITEM_COUNT }),
    queryKey: ["items"],
  }
}

export default function Home() {
  const { data: items, isLoading, isError } = useQuery(
    getItemsQueryOptions()
  )

// const imagesArray = React.useMemo(() => {
//     if (itemData?.images && typeof itemData.images === "string") {
//     return itemData.images
//         .split(",")
//         .map((img) => images_url.concat(img.trim()))
//         .filter(Boolean);
//     }
//     return [];
// }, [itemData]);

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isError || !items) {
    return <div>Error loading data.</div>
  }

  return (
    <div>
      {items.data.map((item: any) => {
        // Grab the first image from the comma-separated string
        const [firstImage] = item.images.split(",")
        const image_url = images_url.concat(firstImage.trim())

        return (
          <div
            key={item.id}
            style={{
              /* Parallax background styles: */
              backgroundImage: `url(${image_url})`,
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
              backgroundPosition: "center",
              /* Adjust height as needed for your parallax sections: */
              height: "1000px",
              /* Some spacing below each parallax section */
              marginBottom: "2rem",
              /* Center contents (foreground) */
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              /* Optional text styling */
              color: "#fff",
              textShadow: "0 0 5px rgba(0,0,0,0.7)",
            }}
          >
            {/* This foreground could be replaced with any dynamic text fields */}
            <h2>{item.title ?? "Parallax Title"}</h2>
            <p>This is a placeholder for text fields that can be populated later.</p>
          </div>
        )
      })}
    </div>
  )
}
