import { create } from "zustand";

interface demoAcc {
  creds: {
    username: string,
    password: string,
  },
  setCreds: (v: { username: string, password: string }) => void
}

const useDemo = create<demoAcc>((set) => ({
    creds: {
        username: '',
        password: ''
    },
    setCreds: (value) => set({ creds: value })
}))

export default useDemo;     
