# React + Vite

## Equipment History

Run the API from this folder with `npm run server`. Students use the Equipment link after signing in. Store Keepers can record a loan by entering the student's registration number and equipment name, then mark the item returned. Student and Store Keeper screens use the same SQLite loan records.

Store Keeper accounts are created by an administrator, not through public registration. In PowerShell, set the account values and run the setup script before starting the API:

```powershell
$env:STOREKEEPER_EMAIL = "keeper@rjt.ac.lk"
$env:STOREKEEPER_PASSWORD = "<choose at least 12 characters>"
npm run create:storekeeper
Remove-Item Env:STOREKEEPER_EMAIL, Env:STOREKEEPER_PASSWORD
```

The account password is stored as a salted hash. Keep the password private and do not commit it to the repository.

Coach and Admin notice-publishing accounts are also admin-created. Run the following in PowerShell from this folder once for each staff account, using a private password of at least 12 characters:

```powershell
$env:STAFF_ROLE = "Gym Coach" # Use "Admin" for an Admin account
$env:STAFF_EMAIL = "coach@rjt.ac.lk"
$env:STAFF_PASSWORD = "<choose a private password of at least 12 characters>"
npm run create:staff
Remove-Item Env:STAFF_ROLE, Env:STAFF_EMAIL, Env:STAFF_PASSWORD
```

These users sign in from the normal login page and publish notices to all students. Students can view and mark notices as read from the dashboard bell.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
