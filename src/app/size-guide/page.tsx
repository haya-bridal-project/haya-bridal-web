import { PolicyPageLayout } from "@/components/storefront/PolicyPageLayout";
import { getSizeGuides } from "@/lib/data/public";

export const dynamic = "force-dynamic";

export default async function SizeGuidePage() {
  const sizeGuides = await getSizeGuides();
  const guide = sizeGuides[0];

  const columns = guide?.columns?.length
    ? guide.columns
    : ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Blouse Length (in)", "Lehenga Length (in)"];

  const rows = guide?.rows?.length
    ? guide.rows
    : [
        ["XS", "32", "26", "36", "13.5", "42"],
        ["S", "34", "28", "38", "14.0", "42"],
        ["M", "36", "30", "40", "14.5", "43"],
        ["L", "38", "32", "42", "15.0", "43"],
        ["XL", "40", "34", "44", "15.5", "44"],
      ];

  return (
    <PolicyPageLayout
      slug="size-guide"
      defaultTitle="Bridal Fitting & Size Guide"
      defaultContent={
        <div className="space-y-6 font-light text-[#2B211C]">
          <p>
            Finding the perfect silhouette is essential for your special day. Below is our standard bridal measurement reference chart. All measurements are listed in inches.
          </p>

          <div className="my-6 overflow-x-auto border border-[#E8DDD1] rounded-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4ECE1] text-[#2B211C] font-semibold uppercase tracking-wider font-sans">
                <tr>
                  {columns.map((c, idx) => (
                    <th key={idx} className="px-4 py-3 border-b border-[#E8DDD1]">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DDD1]">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FAF6F0]">
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 ${
                          cIdx === 0 ? "font-semibold text-[#B06F5E]" : "font-sans"
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs text-xs space-y-2 text-[#7A6A5F]">
            <h4 className="font-serif text-sm text-[#2B211C] font-medium">
              Bespoke Tailoring & Measurements
            </h4>
            <p>
              Remember: Every bridal lehenga in our vault features adjustable side margins and custom blouse hook fittings. When you reserve with Haya, our styling team contacts you to verify exact measurements.
            </p>
          </div>
        </div>
      }
    />
  );
}
