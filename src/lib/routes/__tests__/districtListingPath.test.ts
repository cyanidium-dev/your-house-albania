import { describe, expect, it } from "vitest";
import { buildListingPath, buildListingUrl, districtIsPathSegment } from "../listingRoutes";
import {
  getGeoListingDistrictNormalizeRedirectUrl,
  mergeListingSearchParams,
  resolveListingPathFilters,
} from "../listingRouteResolver";

const TYPES = [{ value: "apartment" }, { value: "villa" }];
const DISTRICTS = ["golem-durres", "shkembi-durres", "plazh"];

describe("district as a path segment (full-geo catalog shape)", () => {
  it("puts the district between the city and the deal", () => {
    expect(
      buildListingPath({ scope: "catalog", locale: "sq", country: "albania", city: "durres", district: "golem-durres" }),
    ).toBe("/sq/albania/durres/golem-durres");
    expect(
      buildListingPath({
        scope: "catalog",
        locale: "sq",
        country: "albania",
        city: "durres",
        district: "golem-durres",
        dealQuery: "sale",
        propertyType: "apartment",
      }),
    ).toBe("/sq/albania/durres/golem-durres/sale/apartment");
  });

  it("drops a query district that the path already carries", () => {
    const url = buildListingUrl({
      scope: "catalog",
      locale: "sq",
      trustedCityCountrySlug: "albania",
      city: "durres",
      district: "golem-durres",
      query: new URLSearchParams("district=golem-durres&sort=newest"),
    });
    expect(url).toBe("/sq/albania/durres/golem-durres?sort=newest");
  });

  it("keeps the district in the query on the omit-country and agent shapes", () => {
    expect(districtIsPathSegment({ scope: "catalog", locale: "sq", city: "durres", district: "plazh" })).toBe(false);
    expect(buildListingUrl({ scope: "catalog", locale: "sq", city: "durres", dealQuery: "sale", district: "plazh" })).toBe(
      "/sq/durres/sale?district=plazh",
    );
    expect(
      buildListingUrl({
        scope: "agent",
        locale: "sq",
        agentSlug: "findall",
        country: "albania",
        city: "durres",
        district: "plazh",
      }),
    ).toBe("/sq/agent/findall/albania/durres?district=plazh");
  });
});

describe("resolveListingPathFilters with districts", () => {
  it("reads a district, then deal and type", () => {
    expect(resolveListingPathFilters(["golem-durres"], TYPES, "geoCity", DISTRICTS)).toEqual({
      dealType: "",
      propertyType: "",
      dealQuery: "",
      district: "golem-durres",
    });
    expect(resolveListingPathFilters(["Golem-Durres", "sale", "apartment"], TYPES, "geoCity", DISTRICTS)).toEqual({
      dealType: "sale",
      propertyType: "apartment",
      dealQuery: "sale",
      district: "golem-durres",
    });
  });

  it("still resolves deal and type without a district", () => {
    expect(resolveListingPathFilters(["sale", "villa"], TYPES, "geoCity", DISTRICTS)).toEqual({
      dealType: "sale",
      propertyType: "villa",
      dealQuery: "sale",
      district: "",
    });
  });

  it("rejects an unknown first segment and a district on agent listings", () => {
    expect(resolveListingPathFilters(["nowhere"], TYPES, "geoCity", DISTRICTS)).toBeNull();
    expect(resolveListingPathFilters(["golem-durres"], TYPES, "agentCity", DISTRICTS)).toBeNull();
  });
});

describe("district canonicalization", () => {
  const geo = { mode: "fullGeo" as const, listingCountrySlug: "albania", listingCitySlug: "durres" };

  it("sends ?district= to the path", () => {
    const merged = mergeListingSearchParams({ district: "Golem-Durres", sort: "newest" });
    expect(
      getGeoListingDistrictNormalizeRedirectUrl({
        locale: "sq",
        geo,
        dealType: "",
        propertyType: "",
        rawSearch: { district: "Golem-Durres", sort: "newest" },
        mergedSearch: merged,
      }),
    ).toBe("/sq/albania/durres/golem-durres?sort=newest");
  });

  it("leaves a path district alone", () => {
    expect(
      getGeoListingDistrictNormalizeRedirectUrl({
        locale: "sq",
        geo,
        dealType: "",
        propertyType: "",
        pathDistrict: "golem-durres",
        rawSearch: {},
        mergedSearch: mergeListingSearchParams({}, undefined, undefined, "golem-durres"),
      }),
    ).toBeNull();
  });

  it("merges the path district into the listing filters", () => {
    expect(mergeListingSearchParams({ district: "plazh" }, "sale", "apartment", "golem-durres")).toEqual({
      district: "golem-durres",
      deal: "sale",
      type: "apartment",
    });
  });
});
