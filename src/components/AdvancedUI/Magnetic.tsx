import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
}

export const Magnetic = ({ children }: MagneticProps) => <>{children}</>;
