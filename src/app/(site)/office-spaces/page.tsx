import HeroSub from "@/components/shared/HeroSub";
import OfficeSpace from "@/components/Properties/OfficeSpaces";
import React from "react";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Property List | Homely",
};

const page = () => {
    return (
        <>
            <HeroSub
                title="Office Spaces."
                description="Experience elegance and comfort with our exclusive luxury  villas, designed for sophisticated living."
                badge="Properties"
            />
            <OfficeSpace />
        </>
    );
};

export default page;