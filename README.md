# Behold dit bogføringsprogram

En professionel landingsside bygget med React, Vite og Tailwind CSS.

## Lokal udvikling

1. Installer afhængigheder:
   ```bash
   npm install
   ```

2. Start udviklingsserver:
   ```bash
   npm run dev
   ```

## Implementering på GitHub Pages

For at deploye til dit eget domæne (`behold-dit-bogforingsprogram.dk`):

1. **GitHub Settings**: 
   Gå til dit repository på GitHub -> **Settings** -> **Pages**.
   
2. **Build and Deployment**:
   Vælg "GitHub Actions" som kilde.
   
3. **Konfiguration**:
   Vite bygger som standard til `dist/` mappen. 

4. **Kontaktformular via Web3Forms**:
   Opret en gratis Access Key på `web3forms.com` (med `info@behold-dit-bogforingsprogram.dk`), og tilføj den på GitHub under **Settings → Secrets and variables → Actions** som `VITE_WEB3FORMS_ACCESS_KEY`.

### Manuel build (uden GitHub Actions)

Hvis du vil uploade manuelt til en host (fx Simply.com):

1. Kør build kommandoen:
   ```bash
   npm run build
   ```
2. Upload alt indholdet fra den genererede `dist/` mappe til din webhosts root (typisk `public_html`, `www` eller lignende).

## DNS Indstillinger

Dine DNS indstillinger ser korrekte ud i dit screenshot. Sørg for at:
- `www` CNAME peger på `din-bruger.github.io`
- Apex domænet (`@`) har de 4 A records til GitHubs IP'er (som vist i dit billede).
