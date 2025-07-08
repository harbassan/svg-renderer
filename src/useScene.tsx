import { useEffect, useState } from "react";
import { getScene, registerListener, unregisterListener } from "./sceneCache";

function useScene() {
    const [scene, setScene] = useState<Record<string, any> | null>(getScene);

    useEffect(() => {
        function sync(details: Record<string, any>) {
            setScene({ ...details.scene });
        }

        registerListener({ id: "use_scene", type: "update_component", callback: sync });

        return () => {
            unregisterListener("use_scene");
        }
    }, [])

    return { scene: scene };
}

export default useScene;
