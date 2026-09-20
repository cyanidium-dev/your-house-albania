import { describe, expect, it } from "vitest";
import imageLoader from "../loader";
import {
  CANONICAL_IMAGE_QUERY,
  canonicalPropertyImageUrl,
  parseSanityImageUrl,
  propertyImageSeoName,
  withImageSeoName,
} from "../propertyImageUrl";

const ASSET =
  "https://cdn.sanity.io/images/g4aqp6ex/production/02cb487135cee7d0553be161562dd5d99610c9a8-1280x753.jpg";
const NAMED = `${ASSET}/apartment-1-1-plazh-durres-3.jpg`;

describe("imageLoader", () => {
  it("hands Sanity images to the CDN with width, quality, format and fit", () => {
    expect(imageLoader({ src: ASSET, width: 640 })).toBe(`${ASSET}?w=640&q=72&auto=format&fit=max`);
  });

  it("keeps an existing query and honours an explicit quality", () => {
    expect(imageLoader({ src: `${ASSET}?rect=0,0,10,10`, width: 828, quality: 60 })).toBe(
      `${ASSET}?rect=0%2C0%2C10%2C10&w=828&q=60&auto=format&fit=max`,
    );
  });

  it("leaves unnamed Sanity images alone at large widths", () => {
    expect(imageLoader({ src: ASSET, width: 2560 })).toBe(`${ASSET}?w=2560&q=72&auto=format&fit=max`);
  });

  it("collapses every large candidate of a named photo onto the canonical URL", () => {
    const canonical = `${NAMED}?${CANONICAL_IMAGE_QUERY}`;
    expect(imageLoader({ src: NAMED, width: 1920 })).toBe(canonical);
    expect(imageLoader({ src: NAMED, width: 2560 })).toBe(canonical);
    expect(canonicalPropertyImageUrl(NAMED)).toBe(canonical);
  });

  it("drops the file name from the small candidates", () => {
    expect(imageLoader({ src: NAMED, width: 384 })).toBe(`${ASSET}?w=384&q=72&auto=format&fit=max`);
    expect(imageLoader({ src: NAMED, width: 1080 })).toBe(`${ASSET}?w=1080&q=72&auto=format&fit=max`);
  });

  it("passes other remote hosts through and optimises local files", () => {
    expect(imageLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
    expect(imageLoader({ src: "/images/a.jpg", width: 640 })).toBe("/_next/image?url=%2Fimages%2Fa.jpg&w=640&q=75");
  });
});

describe("propertyImageUrl", () => {
  it("parses asset, name and query", () => {
    expect(parseSanityImageUrl(`${NAMED}?w=10`)).toEqual({
      asset: ASSET,
      ext: "jpg",
      vanity: "/apartment-1-1-plazh-durres-3.jpg",
      query: "w=10",
    });
    expect(parseSanityImageUrl(ASSET)?.vanity).toBe("");
    expect(parseSanityImageUrl("https://example.com/a.jpg")).toBeNull();
  });

  it("names a photo from locale-independent slugs", () => {
    expect(
      propertyImageSeoName({ typeSlug: "apartment", bedrooms: 1, districtSlug: "plazh", citySlug: "durres" }),
    ).toBe("apartment-1-1-plazh-durres");
    // Only flats use the N+1 notation.
    expect(propertyImageSeoName({ typeSlug: "villa", bedrooms: 4, districtSlug: null, citySlug: "vlore" })).toBe(
      "villa-vlore",
    );
    expect(
      propertyImageSeoName({ typeSlug: "apartment", bedrooms: 0, districtSlug: "plazh-durres", citySlug: "durres" }),
    ).toBe("apartment-plazh-durres");
    expect(propertyImageSeoName({})).toBe("property");
  });

  it("appends the name with the asset's own extension, replacing an older one", () => {
    expect(withImageSeoName(ASSET, "apartment-1-1-plazh-durres", 3)).toBe(NAMED);
    expect(withImageSeoName(NAMED, "villa-vlore", 1)).toBe(`${ASSET}/villa-vlore-1.jpg`);
    expect(withImageSeoName("https://example.com/a.jpg", "x", 1)).toBe("https://example.com/a.jpg");
    expect(withImageSeoName("/images/local.jpg", "x", 1)).toBe("/images/local.jpg");
  });

  it("yields one canonical variant whatever the input query", () => {
    const expected = `${NAMED}?w=1600&fit=max&auto=format&q=75`;
    expect(canonicalPropertyImageUrl(NAMED)).toBe(expected);
    expect(canonicalPropertyImageUrl(`${NAMED}?w=2560&q=72`)).toBe(expected);
    expect(canonicalPropertyImageUrl(ASSET)).toBe(`${ASSET}?w=1600&fit=max&auto=format&q=75`);
    expect(canonicalPropertyImageUrl("/local.jpg")).toBe("/local.jpg");
  });
});
