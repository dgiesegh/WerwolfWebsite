/*
This script contains all flavor text options as a list of possible settings, each consisting of a dictionary
of possible lines.
*/

const globalFlavorLines = [
    {
        "sundown1": ["Zwischen sanft wiegenden Weizenfeldern liegt ein Dorf, ruhig unter dem roten Himmel der untergehenden Sonne."],
        "sundown2": ["Im Abendrot versinkt die untergehende Sonne, während sich die Finsternis über die fernen Fichtenspitzen legt und langsam das Dorf erreicht."],
        "sunrise1": ["Der Hahn kräht und die ersten Sonnenstrahlen fallen warm auf die Weizenfelder, während das Dorf langsam erwacht.",
                     "Das Dorf erwacht, während Vögel fröhlich Weizenkörner von den Feldern picken und ihr Zwitschern die warme Morgenluft erfüllt."],
        "sunrise2": ["Das Dorf erwacht im sanften Nieselregen, während das leise Zwitschern der Vögel die trübe Stille durchbricht."],
        "villagewin": ["Eine warme Briese weht durch die laue Abendluft und der Gesang fröhlichen Dorfbewohner ist noch weit über die Weizenhügel zu hören. Die Welt ist wieder in Ordnung. "],
        "wwwin": ["Rot leuchtende Augen nähern sich vom Waldrand dem Dorf und ein letzter qualvoller Schrei hallt über die Weizenhügel, bevor die Stille der Nacht wieder einkehrt..."],
        "loverswin": ["Die beiden Liebenden sitzen glücklich mit den Beinen baumelnd auf dem dicken Ast der alten Eiche und beobachten wie langsam die rote Sonne hinter den Weizenhügeln verschwindet."],
        "nowin": ["Die tote Stille im Dorf wird einzig durch die an den bleichen Knochen nagenden Ratten unterbrochen..."],
        "discussion": ["Auf einem Hügel, unter der alten Eiche, versammelt sich das Dorf, die Blicke auf den dicken Ast gerichtet – wer wird heute an ihm hängen?"],
        "execution1": ["XY wird langsam zur Eiche geführt, die Schlinge um den Hals gelegt, das Dorf zieht ihn/sie zappelnd empor und nach kurzer Zeit baumelt sein/ihr toter Körper an der alten Dorfeiche.",
                       "Als das gesamte Dorf mit dem Finger auf XY zeigt, stürmt er/sie verzweifelt davon, doch Hund Michi ist schneller, beißt ihm/ihr in die Wade und zieht ihn/sie, zappelnd und schimpfend, zurück zur Eiche, wo XY gegen seinen/ihren Willen gehängt wird.",
                       "Als XY langsam an der Eiche hochgezogen wird, hören die Dorfbewohner ein knarzendes Geräusch, doch der dicke Ast der alten Eiche hält stand und trägt XY weiter, bis er/sie kläglich stirbt."],
        "execution2": ["Als XY langsam an der Eiche hochgezogen wird, hören die Dorfbewohner ein knarzendes Geräusch, und nach kurzer Zeit reißt der Strick – XY liegt schwer atmend auf dem Boden, benommen, aber am Leben.",
                       "Als das Dorf mit dem Finger auf XY zeigt, rennt er/sie panisch davon. Niemand ist schnell genug, ihn/sie einzuholen, und nach kurzer Zeit sieht das Dorf ihn/sie in den fernliegenden Fichten verschwinden – Glück gehabt."],
        "execution3": ["XY wird zur Eiche geführt und aufgeknüpft, zappelnd mit herausquellenden Augen, als plötzlich ein lautes Krachen ertönt und der Ast der Eiche abbricht... XY liegt schwer atmend auf dem Boden, aber immernoch lebendig."],
        "execution4": ["Als das Dorf XY ergreifen will, um ihn/sie zur Eiche zu führen, kreischt XY in hoher Stimme: \"Mein Vati wird euch jagen! Er ist der Großmagier von Ozelot!\" Die Menge verstummt, und XY wird widerwillig freigelassen."],
        "werewolves": ["Im Dorf ist ein Heulen aus dem fernen Wald zu hören – die Werwölfe sind auf der Jagd nach einem Opfer.",
                       "Die Stille der Nacht wird durch ein lautes Heulen aus den im Mondlicht erleuchteten Weizenfeldern durchbrochen – die Werwölfe sind erwacht und suchen nach einem Opfer."],
        "shadowwolf": ["Der Mond verdunkelt sich als der Schattenwolf erwacht, um auf dem Friedhof die Schatten der Toten zu beobachten."],
        "dirtywolf": ["Im Dorf ist ein Zischen und Sabbern zu hören, als der Räudige Wolf fürchterlich durch die Gassen schleicht."],
        "pig": ["Schmatzende und schlürfende Geräusche sind aus einer dunklen Gasse zu hören... Plötzlich verstummen sie und ein riesiger Schatten huscht hinfort."],
        "witch1": ["Die Hexe erwacht, beginnt mit ihrem schaurigen Hexentanz und singt laut ihre Zauberformeln: \"Rattenblitz und Spinnenzahn, schütze uns vor Wolfes Wahn!\" "],
        "witch2": ["\"Ziegenbein und Höllensaat, du seist verflucht und das Ende naht!\""],
        "priest": ["Der Priester wacht auf, um die Häuser seiner Lämmchen zu segnen."],
        "seer": ["Mit seinem dritten Auge blickt der Seher starr in die Seelen der Dorfbewohner. "],
        "necro": ["Inmitten der Weizenfelder führt der Nekromant sein verbotenes Ritual durch und blickt ins Reich der Toten."],
        "girl": ["Ein kleines Mädchen späht neugierig auf die im Mondschein erhellten Weizenfelder...."],
        "bitch": ["Ihren roten Rock tragend, streift die Dorfschlampe von Tür zu Tür und sucht nach einsamen Herzen."],
        "homeless": ["Stinkend und sabbernd schlurft der Obdachlose durch die Gassen und sucht nach einem Ort zum Pennen."],
        "clerk": ["Noch spät im Archiv wühlt sich der Beamte durch verschiedenste Akten."],
        "lotte": ["Ein markdurchdringender Schrei hallt durch das Dorf: \"Kreiiiiiiiiischhhhh!\". Fieselotte war für immer verstummt..."],
        "crossbow": ["XY taumelt blutend vom Waldrand zur alten Eiche, eine Armbrust in der Hand, das Dorf erstarrt vor Schreck."],
        "silence": ["Der mit dem Schweigetrank erwacht und überlegt, wem er/sie die ewige Stille einflößen soll."],
        "robber": ["Geschützt von der Dunkelheit, schleicht sich der Leichenfledderer auf den Friedhof und sucht nach den verbliebenen Schätzen der Toten. "],
        "dog": ["Hund Michi muss schon wieder pieseln! Er weckt seinen Besitzer und führt ihn auf eine interessante Spur."],
        "lovepot": ["Der Liebestrank, in rotem Glanz, wird zwei Glücklichen eingeflößt und weckt ein brennendes Verlangen."],
        "hatepot": ["Pechschwarz und blubbernd brodelt der Hasstrank – ein Schluck, und zwei Seelen brennen vor Zorn, bis nur noch eine von ihnen atmet."],
        "plague": ["Ein fürchterlicher Gestank dringt aus XYs Hütte und beim Öffnen der Tür stürmen hunderte Ratten heraus. Inmitten des Chaos liegt XYs lebloser Körper – übersät mit eitrigen Beulen..."],
        "woodworm": ["Der Hüter des Holzwurms brütet nachdenklich über dem Terrarium, während er seinen Wurm mit Sägemehl füttert.",
                    "Der Holzwurm schnurrt ganz entzückt, während ihn sein Besitzer mit Sägemehl füttert."],
        "woodwormgone": ["Der Besitzer des Holzwurms sucht verzweifelt nach seinem Haustier."]
    }
]

