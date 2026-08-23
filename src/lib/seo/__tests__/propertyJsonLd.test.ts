import { describe, it, expect } from "vitest";
import {
  accommodationTypeFor,
  availabilityFor,
  buildOffer,
  buildPropertyJsonLd,
} from "../propertyJsonLd";

describe("accommodationTypeFor", () => {
  it("maps dwellings to their schema.org type", () => {
    expect(accommodationTypeFor("apartment")).toBe("Apartment");
    expect(accommodationTypeFor("studio")).toBe("Apartment");
    expect(accommodationTypeFor("penthouse")).toBe("Apartment");
    expect(accommodationTypeFor("house")).toBe("House");
    expect(accommodationTypeFor("villa")).toBe("House");
  });

  // Land is not a dwelling. Claiming otherwise is what this guards.
  it("refuses a type that is not an Accommodation", () => {
    expect(accommodationTypeFor("land")).toBeNull();
    expect(accommodationTypeFor("office")).toBeNull();
    expect(accommodationTypeFor("commercial-space")).toBeNull();
    expect(accommodationTypeFor("short-term-rent")).toBeNull();
  });

  it("refuses an unknown or missing type rather than guessing", () => {
    expect(accommodationTypeFor("chalet")).toBeNull();
    expect(accommodationTypeFor(null)).toBeNull();
    expect(accommodationTypeFor(undefined)).toBeNull();
  });
});

describe("availabilityFor", () => {
  it("reads the lifecycle, which is the field that carries sold", () => {
    expect(availabilityFor("sold")).toBe("https://schema.org/SoldOut");
    expect(availabilityFor("rented")).toBe("https://schema.org/LimitedAvailability");
    expect(availabilityFor("reserved")).toBe("https://schema.org/LimitedAvailability");
    expect(availabilityFor("active")).toBe("https://schema.org/InStock");
    expect(availabilityFor("draft")).toBe("https://schema.org/InStock");
    expect(availabilityFor("archived")).toBe("https://schema.org/InStock");
  });

  it("defaults to InStock when unset", () => {
    expect(availabilityFor(null)).toBe("https://schema.org/InStock");
    expect(availabilityFor(undefined)).toBe("https://schema.org/InStock");
  });

  // The old code tested status === "sold", but status only ever holds
  // sale / rent / short-term, so SoldOut was unreachable.
  it("is not fooled by a deal type", () => {
    expect(availabilityFor("sale")).toBe("https://schema.org/InStock");
    expect(availabilityFor("rent")).toBe("https://schema.org/InStock");
  });
});

describe("buildOffer", () => {
  it("marks a sale with the GoodRelations sell function and no period", () => {
    const o = buildOffer({ price: 78000, status: "sale", lifecycleStatus: "active", url: "u" });
    expect(o).toEqual({
      "@type": "Offer",
      price: 78000,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      businessFunction: "http://purl.org/goodrelations/v1#Sell",
      url: "u",
    });
  });

  // Four rent listings advertised a monthly rent as a flat price.
  it("gives a rent the month unit and keeps the flat price", () => {
    const o = buildOffer({ price: 250, status: "rent", lifecycleStatus: "active", url: "u" }) as Record<
      string,
      unknown
    >;
    expect(o.businessFunction).toBe("http://purl.org/goodrelations/v1#LeaseOut");
    expect(o.price).toBe(250);
    expect(o.priceSpecification).toEqual({
      "@type": "UnitPriceSpecification",
      price: 250,
      priceCurrency: "EUR",
      unitCode: "MON",
      unitText: "month",
    });
  });

  it("treats short-term as a lease too", () => {
    const o = buildOffer({ price: 60, status: "short-term", lifecycleStatus: "active", url: "u" }) as Record<
      string,
      unknown
    >;
    expect(o.businessFunction).toBe("http://purl.org/goodrelations/v1#LeaseOut");
    expect(o.priceSpecification).toBeDefined();
  });

  it("carries a sold lifecycle into the offer", () => {
    const o = buildOffer({ price: 78000, status: "sale", lifecycleStatus: "sold", url: "u" }) as Record<
      string,
      unknown
    >;
    expect(o.availability).toBe("https://schema.org/SoldOut");
  });

  it("is undefined without a price", () => {
    expect(buildOffer({ price: null, status: "sale", lifecycleStatus: "active", url: "u" })).toBeUndefined();
  });
});

const BASE = {
  name: "Apartment 1+1 by the sea",
  slug: "flat",
  description: "Nice flat.",
  location: "Plazh, Durres",
  countryCode: "AL",
  price: 78000,
  status: "sale",
  lifecycleStatus: "active",
  propertyTypeSlug: "apartment",
  rooms: 2,
  beds: 1,
  baths: 1,
  area: 42,
  yearBuilt: 2019,
  datePosted: "2026-05-04T10:43:39Z",
  imageUrls: ["https://cdn.example/a.jpg"],
  baseUrl: "https://www.domlivo.com",
  locale: "en",
};

function nodes(out: unknown): Record<string, Record<string, unknown>> {
  const graph = (out as { "@graph": Record<string, unknown>[] })["@graph"];
  const by: Record<string, Record<string, unknown>> = {};
  for (const n of graph) by[String(n["@type"])] = n;
  return by;
}

describe("buildPropertyJsonLd", () => {
  it("counts rooms and bedrooms as different numbers", () => {
    const a = nodes(buildPropertyJsonLd(BASE)).Apartment;
    expect(a.numberOfRooms).toBe(2);
    expect(a.numberOfBedrooms).toBe(1);
  });

  it("omits numberOfRooms rather than falling back to bedrooms", () => {
    const a = nodes(buildPropertyJsonLd({ ...BASE, rooms: undefined })).Apartment;
    expect(a.numberOfRooms).toBeUndefined();
    expect(a.numberOfBedrooms).toBe(1);
  });

  // RealEstateListing is a WebPage subtype. It describes the page, not the flat.
  it("keeps dwelling properties off the listing node", () => {
    const listing = nodes(buildPropertyJsonLd(BASE)).RealEstateListing;
    for (const key of [
      "floorSize",
      "numberOfRooms",
      "numberOfBedrooms",
      "numberOfBathroomsTotal",
      "address",
    ]) {
      expect(listing[key]).toBeUndefined();
    }
    expect(listing.additionalType).toBeUndefined();
  });

  it("links the listing to the accommodation by @id, and that node exists", () => {
    const out = buildPropertyJsonLd(BASE);
    const by = nodes(out);
    const ref = (by.RealEstateListing.mainEntity as { "@id": string })["@id"];
    expect(ref).toBe(by.Apartment["@id"]);
    const ids = (out as { "@graph": Record<string, unknown>[] })["@graph"].map((n) => n["@id"]);
    expect(ids).toContain(ref);
  });

  it("puts the address on the accommodation, with the country", () => {
    const a = nodes(buildPropertyJsonLd(BASE)).Apartment;
    expect(a.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Plazh, Durres",
      addressCountry: "AL",
    });
  });

  it("omits addressCountry when no code is known", () => {
    const a = nodes(buildPropertyJsonLd({ ...BASE, countryCode: null })).Apartment;
    expect(a.address).toEqual({ "@type": "PostalAddress", addressLocality: "Plazh, Durres" });
  });

  it("emits no accommodation node for land, and keeps its facts on the product", () => {
    const out = buildPropertyJsonLd({ ...BASE, propertyTypeSlug: "land" });
    const by = nodes(out);
    expect(by.Apartment).toBeUndefined();
    expect(by.House).toBeUndefined();
    expect(by.RealEstateListing.mainEntity).toBeUndefined();
    expect(by.Product.additionalProperty).toBeDefined();
  });

  it("uses House for a villa", () => {
    expect(nodes(buildPropertyJsonLd({ ...BASE, propertyTypeSlug: "villa" })).House).toBeDefined();
  });

  it("carries floorSize and yearBuilt on the accommodation", () => {
    const a = nodes(buildPropertyJsonLd(BASE)).Apartment;
    expect(a.floorSize).toEqual({ "@type": "QuantitativeValue", value: 42, unitCode: "MTK" });
    expect(a.yearBuilt).toBe(2019);
  });

  it("dates the listing", () => {
    expect(nodes(buildPropertyJsonLd(BASE)).RealEstateListing.datePosted).toBe(
      "2026-05-04T10:43:39Z",
    );
  });

  it("puts the rooms count in the product fact list too", () => {
    const props = nodes(buildPropertyJsonLd(BASE)).Product.additionalProperty as Array<{
      name: string;
      value: number;
    }>;
    expect(props).toContainEqual({ "@type": "PropertyValue", name: "Rooms", value: 2 });
    expect(props).toContainEqual({ "@type": "PropertyValue", name: "Bedrooms", value: 1 });
  });

  it("stays serialisable", () => {
    expect(() => JSON.stringify(buildPropertyJsonLd(BASE))).not.toThrow();
  });
});
