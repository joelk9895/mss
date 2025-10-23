"use client";
import { motion } from "motion/react";
import { LampContainer } from "@/components/ui/lamp";



export default function LampDemo() {
        return (
                <LampContainer>
                        <motion.h1
                                initial={{ y: 100 }}
                                whileInView={{ y: 0 }}
                                transition={{
                                        delay: 0.3,
                                        duration: 0.8,
                                        ease: "easeInOut",
                                }} 
                                className="mt-8 text-green py-4  text-center text-4xl font-medium tracking-tight  md:text-7xl"
                        >
                                Manage your legal practice <br /> the right way
                        </motion.h1>
                </LampContainer>
        );
}
