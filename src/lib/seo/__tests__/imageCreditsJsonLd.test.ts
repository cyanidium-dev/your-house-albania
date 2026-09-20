import { describe, expect, it } from "vitest";
import { buildImageCreditsJsonLd, imageCreditAlt } from "../imageCreditsJsonLd";

const BASE = "https://www.domlivo.com/";

describe("buildImageCreditsJsonLd", () => {
  it("declares a licence only where one is on record", () => {
    const jsonLd = buildImageCreditsJsonLd(
      [
        {
          title: "The beach at Durrës, Albania",
          author: "Shkelzen A. Rexha",
          licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
          sourceUrl: "https://commons.wikimedia.org/wiki/File:Plazhi.jpg",
          imageUrl: "/images/albania/durres.jpg",
        },
        {
          title: "Amphitheatre",
          author: "Someone",
          licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
          imageUrl: "https://cdn.sanity.io/images/p/production/abc-2000x1333.jpg?w=320&h=214&fit=crop&auto=format",
        },
        { title: "No licence", author: "Someone", imageUrl: "/images/x.jpg" },
        { title: "No author", licenceUrl: "https://creativecommons.org/licenses/by/4.0/", imageUrl: "/images/y.jpg" },
      ],
      BASE,
    ) as { "@graph": Array<Record<string, unknown>> };

    expect(jsonLd["@graph"]).toEqual([
      {
        "@type": "ImageObject",
        contentUrl: "https://www.domlivo.com/images/albania/durres.jpg",
        name: "The beach at Durrës, Albania",
        license: "https://creativecommons.org/publicdomain/zero/1.0/",
        acquireLicensePage: "https://commons.wikimedia.org/wiki/File:Plazhi.jpg",
        creditText: "Shkelzen A. Rexha",
        creator: { "@type": "Person", name: "Shkelzen A. Rexha" },
      },
      {
        "@type": "ImageObject",
        contentUrl: "https://cdn.sanity.io/images/p/production/abc-2000x1333.jpg",
        name: "Amphitheatre",
        license: "https://creativecommons.org/licenses/by-sa/4.0/",
        creditText: "Someone",
        creator: { "@type": "Person", name: "Someone" },
      },
    ]);
  });

  it("returns null when nothing qualifies", () => {
    expect(buildImageCreditsJsonLd([{ title: "x", imageUrl: "/x.jpg" }], BASE)).toBeNull();
  });
});

describe("imageCreditAlt", () => {
  it("describes the photo and names the author", () => {
    expect(imageCreditAlt({ title: "Tirana seen from above", author: "mikestuartwood" })).toBe(
      "Tirana seen from above — mikestuartwood",
    );
    expect(imageCreditAlt({ title: " ", author: "A" })).toBe("A");
    expect(imageCreditAlt({})).toBe("");
  });
});
