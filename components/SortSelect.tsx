"use client";

export default function SortSelect({ value, params }: { value: string; params: Record<string, string> }) {
  const go = (sort: string) => {
    const sp = new URLSearchParams();
    for (const k of ["cat", "q", "min", "max", "stock"]) if (params[k]) sp.set(k, params[k]);
    sp.set("sort", sort);
    location.href = "/products?" + sp.toString();
  };
  return (
    <select className="input" value={value} onChange={(e) => go(e.target.value)}>
      <option value="feat">Featured</option>
      <option value="lo">Price: low to high</option>
      <option value="hi">Price: high to low</option>
      <option value="rate">Top rated</option>
    </select>
  );
}
