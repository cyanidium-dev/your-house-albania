"use client";

import * as React from "react";
import { FilterSelect } from "@/components/catalog/FilterSelect";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ALL_PER_EUR } from "@/lib/calculators/utilities";
import { computeReference } from "@/lib/referencePrices/calc";
import { formatSq, type ReferencePlace } from "@/lib/referencePrices/data";
import { PANEL } from "@/components/shared/layout";
import { cn } from "@/lib/utils";

const lek = (n: number) => `${formatSq(n)} lekë`;
const eur = (n: number) => `${formatSq(n)} €`;

const INPUT =
  "h-10 w-full rounded-xl border border-dark/10 bg-transparent px-3 text-sm text-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-white/10 dark:text-white";
const LABEL = "mb-1 block text-xs font-medium text-dark/70 dark:text-white/80";

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        inputMode="decimal"
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
      />
      {hint ? <p className="mt-1 text-xs leading-relaxed text-dark/55 dark:text-white/50">{hint}</p> : null}
    </div>
  );
}

const parse = (s: string) => Number(s.replace(/\s/g, "").replace(",", ".")) || 0;

/**
 * The reference-price calculator of `/sq/cmimet-e-references`: the zone's
 * official price, the depreciation, the deemed sale value and the taxes that
 * use it. Prices are typed in euro, as flats are priced; the taxes are in lek,
 * as ASHK charges them, with the euro beside.
 */
export function ReferencePriceCalculator({ places }: { places: readonly ReferencePlace[] }) {
  const { rates } = useCurrency();
  const allPerEur = typeof rates.rates.ALL === "number" && rates.rates.ALL > 0 ? rates.rates.ALL : ALL_PER_EUR;

  const [place, setPlace] = React.useState(places[0]?.key ?? "");
  const [sqm, setSqm] = React.useState("60");
  const [years, setYears] = React.useState("0");
  const [contract, setContract] = React.useState("90000");
  const [purchase, setPurchase] = React.useState("");

  const zone = places.find((p) => p.key === place) ?? places[0];
  const r = computeReference({
    pricePerSqm: zone?.value ?? 0,
    sqm: parse(sqm),
    years: parse(years),
    contractPrice: parse(contract) * allPerEur,
    purchasePrice: parse(purchase) * allPerEur,
  });
  const both = (all: number) => (
    <>
      <span className="font-semibold text-dark dark:text-white">{lek(all)}</span>{" "}
      <span className="text-dark/60 dark:text-white/60">≈ {eur(all / allPerEur)}</span>
    </>
  );

  return (
    <div className={cn(PANEL, "p-5 md:p-8")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FilterSelect
          label="Qyteti ose zona"
          value={place}
          onValueChange={setPlace}
          options={places.map((p) => ({ value: p.key, label: `${p.name}: ${lek(p.value)}/m²` }))}
          includeAnyOption={false}
          anyLabel=""
        />
        <NumberField id="ref-sqm" label="Sipërfaqja (m²)" value={sqm} onChange={setSqm} />
        <NumberField
          id="ref-contract"
          label="Çmimi në kontratë (€)"
          hint="Çmimi me të cilin shitet apartamenti."
          value={contract}
          onChange={setContract}
        />
        <NumberField
          id="ref-years"
          label="Vite nga fitimi i parë i titullit"
          hint="Vlera e referencës ulet 1% për çdo vit të plotë, deri në 30%."
          value={years}
          onChange={setYears}
        />
        <NumberField
          id="ref-purchase"
          label="Sa e bleu shitësi (€), opsionale"
          hint="Ose vlera e fundit e regjistruar. Duhet për tatimin 15% dhe rivlerësimin 5%."
          value={purchase}
          onChange={setPurchase}
        />
      </div>

      <dl className="mt-8 grid gap-4 border-t border-dark/10 pt-6 text-[15px] leading-relaxed dark:border-white/10">
        <div>
          <dt className="text-dark/60 dark:text-white/60">
            Vlera e referencës ({zone?.name}, {lek(zone?.value ?? 0)}/m²
            {r.depreciation > 0 ? `, minus ${Math.round(r.depreciation * 100)}%` : ""})
          </dt>
          <dd>{both(r.referenceValue)}</dd>
        </div>
        <div>
          <dt className="text-dark/60 dark:text-white/60">Baza për tatimin dhe tarifat</dt>
          <dd>
            {both(r.deemedSaleValue)}{" "}
            <span className="text-dark/60 dark:text-white/60">
              {r.referenceApplies
                ? "(vlera e referencës është më e lartë se çmimi në kontratë, prandaj zbatohet ajo)"
                : "(çmimi në kontratë është më i lartë, prandaj zbatohet ai)"}
            </span>
          </dd>
        </div>
        {r.capitalGainsTax !== null ? (
          <div>
            <dt className="text-dark/60 dark:text-white/60">Tatimi 15% mbi fitimin kapital, i paguar nga shitësi</dt>
            <dd>{both(r.capitalGainsTax)}</dd>
          </div>
        ) : null}
        {r.revaluationTax !== null ? (
          <div>
            <dt className="text-dark/60 dark:text-white/60">
              Nëse pronari e rivlerëson në 2026 me këtë çmim: 5% mbi diferencën
            </dt>
            <dd>{both(r.revaluationTax)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-dark/60 dark:text-white/60">Taksa vjetore e ndërtesës, 0,05% (bashkia mund ta ndryshojë ±30%)</dt>
          <dd>
            <span className="font-semibold text-dark dark:text-white">
              {lek(r.buildingTaxYear.low)} - {lek(r.buildingTaxYear.high)}
            </span>{" "}
            <span className="text-dark/60 dark:text-white/60">në vit</span>
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-xs leading-relaxed text-dark/55 dark:text-white/50">
        Llogaritje orientuese sipas akteve në fuqi më 21 tetor 2026, me kursin {allPerEur.toFixed(2).replace(".", ",")} lekë për 1 €. Shumën përfundimtare e llogarit noteri dhe ASHK.
      </p>
    </div>
  );
}
