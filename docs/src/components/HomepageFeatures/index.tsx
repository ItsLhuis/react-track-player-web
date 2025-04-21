import React from "react"

import clsx from "clsx"
import styles from "./styles.module.css"

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<"svg">>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: "Simple Audio Integration",
    Svg: require("@site/static/img/undraw_audio_player.svg").default,
    description: (
      <>
        Easily integrate powerful audio playback into your React web applications with a clean,
        intuitive API inspired by react-native-track-player.
      </>
    )
  },
  {
    title: "Complete Playback Control",
    Svg: require("@site/static/img/undraw_building_blocks.svg").default,
    description: (
      <>
        Full control of audio playback with queue management, repeat modes, volume control, media
        session integration, and comprehensive event system.
      </>
    )
  },
  {
    title: "React Hooks Ready",
    Svg: require("@site/static/img/undraw_react_hooks.svg").default,
    description: (
      <>
        Built-in React hooks for tracking playback state, progress, active track, and more, making
        integration with your React components seamless.
      </>
    )
  }
]

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md" style={{ marginTop: "1rem" }}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
