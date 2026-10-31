/**
 * Publicera eller spara som utkast. Knapparna sätter published, så formuläret behöver ingen egen växel.
 * Ett publicerat inlägg sparas med huvudknappen och görs till utkast med den andra.
 */
export function publishButtons(item: { published: number } | null | undefined, newLabel = "Publicera") {
  return {
    submitLabel: !item ? newLabel : item.published ? "Spara ändringar" : "Publicera",
    submitValue: { name: "published", value: "1" },
    secondary: { label: !item ? "Spara som utkast" : item.published ? "Gör till utkast" : "Spara utkast", name: "published", value: "0" },
  };
}
