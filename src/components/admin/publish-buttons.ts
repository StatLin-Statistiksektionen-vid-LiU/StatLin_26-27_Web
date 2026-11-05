/**
 * Publicera eller spara som utkast. Knapparna sätter published, så formuläret behöver ingen egen växel.
 * Ett publicerat inlägg sparas med huvudknappen och görs till utkast med den andra. För ett nytt inlägg ligger
 * "Spara som utkast" först, så att Enter i ett fält sparar ett utkast i stället för att publicera.
 */
export function publishButtons(item: { published: boolean } | null | undefined, newLabel = "Publicera") {
  return {
    submitLabel: !item ? newLabel : item.published ? "Spara ändringar" : "Publicera",
    submitValue: { name: "published", value: "1" },
    secondary: { label: !item ? "Spara som utkast" : item.published ? "Gör till utkast" : "Spara utkast", name: "published", value: "0" },
    secondaryFirst: !item,
  };
}
