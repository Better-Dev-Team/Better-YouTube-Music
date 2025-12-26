# Versioning Scheme

This project follows a specific versioning scheme inspired by Muv-Luv Theory of Strategic Federals (TSF) nomenclature.

## Format
The version string follows this structure:
`[Major].[Normal Update].[Minor Update]-[Submodel]-[Nickname]`

Example: `2.2.1-pz-Berkut`

### 1. Version Numbers (`2.2.1`)
- **Major**: Significant architecture changes or complete overhauls.
- **Normal Update**: New features and major improvements.
- **Minor Update**: Minor features, bug fixes, and maintenance.

### 2. Hotfix / Submodel (`pz`)
Hotfixes or specific builds are named after TSF submodels (e.g., `E`, `C`, `pz`).
- This follows the first hyphen.
- It must be alphanumeric only (no spaces) to remain SemVer compliant.

### 3. Codename / Nickname (`Berkut`)
Major releases or specific versions are given a codename based on Muv-Luv TSF nicknames (e.g., `BERKUT` for the Su-47).

## SemVer Compliance
To ensure the auto-updater functions correctly, the version string must be **SemVer compliant**. 
- Always use a hyphen (`-`) after the version numbers if adding a submodel or nickname.
- **Valid**: `2.2.1-pz-Berkut`
- **Invalid**: `2.2.1pz-Berkut` (lacks hyphen after the numbers)
- **Invalid**: `2.2.1-pz Berkut` (contains space)

## GitHub Releases
When creating a release on GitHub:
1. **Tag Name**: Must be the exact version string (e.g., `2.2.1-pz-Berkut`). This is what the auto-updater uses.
2. **Release Title**: Can be more descriptive (e.g., `Better YouTube - Berkut Update (2.2.1)`).
3. **Assets**: You must upload the `.exe` installer AND the `latest.yml` file generated in your `release` folder. The updater needs `latest.yml` to know which files to download.
