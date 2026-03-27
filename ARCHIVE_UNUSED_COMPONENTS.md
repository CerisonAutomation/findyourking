# 🗃️ ARCHIVED COMPONENTS

## **MasculineCard Component**

- **Status**: DELETED - Replaced with standard Card component
- **Reason**: Duplicate functionality, inconsistent with shadcn/ui patterns
- **Replacement**: Use `<Card className="masculine-styles">`
- **Files Updated**:
    - `/src/app/auth/signin/page.tsx`
    - `/src/app/auth/signup/page.tsx`
    - `/src/components/ui/masculine-theme.tsx` (removed variants)

## **MasculineButton Component**

- **Status**: DELETED - Merged into standard Button component
- **Reason**: Code duplication, maintenance overhead
- **Replacement**: Use `<Button variant="masculine">`
- **Files Updated**: All component files using MasculineButton

## **Duplicate Auth Routes**

- **Status**: DELETED - Consolidated to single routes
- **Reason**: Duplicate functionality, confusing navigation
- **Replacements**:
    - `/auth/login` → `/auth/signin`
    - `/auth/register` → `/auth/signup`
- **Files Updated**: Route structure, navigation links

## **Backup Files**

- **Status**: DELETED - Unnecessary backups
- **Files**: `error.tsx.bak`
- **Reason**: Version control handles backups
