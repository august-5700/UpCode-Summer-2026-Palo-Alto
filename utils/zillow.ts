export const zillowUrl = (address: string | null | undefined): string | null => {
    if (!address) return null;

    const slug = address
        .trim()
        .replace(/[#.,]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return slug ? `https://www.zillow.com/homes/${encodeURIComponent(slug)}_rb/` : null;
};
