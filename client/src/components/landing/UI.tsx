import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion } from "framer-motion";
import { type FC, useEffect, useRef } from "react";
import {
  SwitchTransition,
  Transition,
  TransitionStatus,
} from "react-transition-group";
import useAudio from "@/hooks/useAudio";
import useAudioStore from "@/hooks/useAudioStore";
import useStageStore, { Stage } from "@/hooks/useStageStore";
import { useNavigate } from "react-router-dom";

const UI: FC = () => {
  const stage = useStageStore((s) => s.stage);
  const wrapper = useRef<HTMLDivElement>(null);

  const { playAudio: playBackgroundAudio } = useAudio({
    src: "/sounds/background.aac",
    loop: true,
    volume: 0.4,
  });

  useEffect(() => {
    if (stage === Stage.ENTER) playBackgroundAudio();
  }, [stage]);

  return (
    <SwitchTransition mode="in-out">
      <Transition
        key={stage}
        timeout={{ enter: 0, exit: 800 }}
        nodeRef={wrapper}
        appear={true}
      >
        {(transitionStatus) => {
          return (
            <div
              ref={wrapper}
              className=" fixed inset-0 flex items-center justify-center select-none"
            >
              {stage === Stage.PREFERENCES && (
                <Preferences transitionStatus={transitionStatus} />
              )}
              {stage === Stage.LOGO && (
                <div className="w-screen h-screen flex justify-center items-center">
                  <Hero />
                </div>
              )}
            </div>
          );
        }}
      </Transition>
    </SwitchTransition>
  );
};

export default UI;

type PreferencesProps = {
  transitionStatus: TransitionStatus;
};

const Preferences: FC<PreferencesProps> = ({ transitionStatus }) => {
  const setStage = useStageStore((s) => s.setStage);
  const setIsMuted = useAudioStore((s) => s.setIsMuted);

  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (transitionStatus === "entered") {
        gsap.to(container.current, { opacity: 1, duration: 1 });
      }
      if (transitionStatus === "exiting") {
        gsap.to(container.current, { opacity: 0, duration: 0.3 });
      }
    },
    { dependencies: [transitionStatus], scope: container }
  );

  const onEnterClick = (isMuted: boolean) => {
    setIsMuted(isMuted);
    setStage(Stage.ENTER);
  };

  return (
    <section
      ref={container}
      className="absolute flex flex-col items-center justify-center gap-8 opacity-0"
    >
      <button
        className="flex items-center gap-3 text-xl font-medium transition-opacity duration-200 hover:opacity-70"
        onClick={() => onEnterClick(false)}
      >
        Naam
      </button>
    </section>
  );
};

const Hero = () => {
  const { playAudio: playButtonAudio } = useAudio({
    src: "/sounds/button.aac",
    loop: false,
  });
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0.0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3,
        duration: 0.8,
        ease: "easeInOut",
      }}
      className="relative flex flex-col gap-4 items-center justify-center px-4"
    >
      <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
        Background lights are cool you know.
      </div>
      <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
        And this, is chemical burn.
      </div>
      <button
        onClick={() => {
          console.log("Navigating...");
          playButtonAudio();
          setInterval(() => navigate("/dashboard"), 2700);
        }}
        className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-4 py-2"
      >
        Debug now
      </button>
    </motion.div>
  );
};
