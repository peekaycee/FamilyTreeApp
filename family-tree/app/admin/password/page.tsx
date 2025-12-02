"use client";
import styles from "../admin.module.css";
import Button from "../../../components/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD; // from .env

export default function PasswordChecker() {
  const router = useRouter();
  const [inputPassword, setInputPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const checkPassword = () => {
    if (inputPassword === correctPassword) {
      router.push("/admin");
    } else {
      setErrorMessage("Incorrect password. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      checkPassword();
    }
  };

  return (
    <div className={styles.passwordPage}>
      <input
        type="password"
        placeholder="Insert password"
        value={inputPassword}
        onChange={(e) => setInputPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button tag={"Access"} onClick={checkPassword} />
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
    </div>
  );
}
