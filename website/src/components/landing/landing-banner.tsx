import React from "react";
import { NFLinkButton } from "./nf-link-button";
import { Divider } from "./divider";

export const LandingBanner = ({
  body,
  cta,
  heading,
  showDivider,
}: {
  body: string;
  cta: { link: string; text: string };
  heading: string;
  showDivider?: boolean;
}) => (
  <div className="flex flex-col text-left my-8">
    {showDivider && <Divider />}

    <h2 className="my-8 text-4xl font-semibold">{heading}</h2>
    <p className="text-lg">{body}</p>
    <NFLinkButton link={cta.link} text={cta.text} />
  </div>
);
