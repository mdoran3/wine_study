import styles from './SherryInfoPanel.module.css';
import SoleraDiagram from '../SoleraDiagram/SoleraDiagram';

const SOLERA_TIERS = [
  { label: '3rd Criadera', sub: 'youngest wine — newest additions', key: 'tier3' },
  { label: '2nd Criadera', sub: 'younger still',                    key: 'tier2' },
  { label: '1st Criadera', sub: 'slightly younger',                 key: 'tier1' },
  { label: 'Solera',       sub: 'oldest — wine extracted here',     key: 'tierSolera' },
];

export default function SherryInfoPanel() {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>About Spanish Sherry</h3>

      {/* ── Four background facts ── */}
      <div className={styles.grid}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>What is Sherry?</h4>
          <p className={styles.sectionText}>
            A fortified wine from southern Spain, made from <strong>Palomino</strong>,{' '}
            <strong>Moscatel</strong>, and <strong>Pedro Ximénez</strong> grapes. Known for its
            wide range of styles, from very dry to very sweet.
          </p>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>The Sherry Triangle</h4>
          <p className={styles.sectionText}>
            Produced exclusively in Andalusia, province of Cádiz, across three towns:
          </p>
          <ul className={styles.list}>
            <li><strong>Jerez de la Frontera</strong> — main production center</li>
            <li><strong>Sanlúcar de Barrameda</strong> — coastal</li>
            <li><strong>El Puerto de Santa María</strong> — aging &amp; export hub</li>
          </ul>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Fortification</h4>
          <p className={styles.sectionText}>
            A neutral grape spirit (Spanish brandy) is added after fermentation. This raises the
            alcohol level, and that final alcohol level determines the style of sherry produced.
          </p>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Albariza Soil</h4>
          <p className={styles.sectionText}>
            The region's unique white soil is called <strong>albariza</strong> — chalky and
            limestone-rich. It retains water well, helps vines survive the hot dry climate, and
            contributes to sherry's fresh, mineral character.
          </p>
        </div>
      </div>

      {/* ── Under Flor ── */}
      <div className={styles.imageSection}>
        <h4 className={styles.sectionTitle}>Ageing Under Flor</h4>
        <div className={styles.florLayout}>
          <img
            src="/sherry_flor.jpg"
            alt="Flor yeast layer visible through a glass window in a sherry barrel at Bodegas Valdivia, Jerez"
            className={styles.florPhoto}
          />
          <p className={styles.sectionText}>
            <strong>Flor</strong> is a natural layer of yeast that forms on the surface of the
            wine inside the barrel. It acts as a protective blanket, shielding the wine from
            oxygen and preserving its pale color and fresh, delicate character. Styles aged under
            flor — <strong>Fino</strong> and <strong>Manzanilla</strong> — are the driest and
            lightest sherries. The thickness and activity of the flor is greatly influenced by the
            local microclimate: Manzanilla's coastal humidity in Sanlúcar de Barrameda keeps the
            flor especially lively and thick year-round, giving it a distinctive briny, sea-air
            quality.
          </p>
        </div>
        <p className={styles.photoCredit}>
          Photo: El Pantera /{' '}
          <a href="https://commons.wikimedia.org/wiki/File:FLOR-ValdiviaJerez59.jpg"
            target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>{' '}
          · CC BY-SA 3.0
        </p>
      </div>

      {/* ── Ageing Oxidatively ── */}
      <div className={styles.imageSection}>
        <h4 className={styles.sectionTitle}>Ageing Oxidatively</h4>
        <div className={styles.florLayout}>
          <img
            src="/sherry_oxidative.jpg"
            alt="Oloroso sherry barrels stacked in the criadera-solera system at Bodegas Valdivia, Jerez"
            className={styles.florPhoto}
          />
          <p className={styles.sectionText}>
            Oxidative ageing means the wine develops in direct contact with oxygen — there is no
            flor to act as a protective barrier. Barrels are intentionally left with a headspace,
            allowing air to interact with the wine through the porous oak, gradually deepening its
            color from gold to rich amber or mahogany and building complex aromas of toasted nuts,
            dried fruits, leather, and warm spice.{' '}
            <strong>Oloroso</strong> is fortified to a higher alcohol level (~18% ABV) that
            prevents flor from forming at all, making it fully oxidative from the start.{' '}
            <strong>Amontillado</strong> takes a different path — it begins its life under flor as
            a Fino or Manzanilla, then transitions to oxidative ageing once the flor naturally
            dies, combining the freshness of biological ageing with the depth of oxidative.
          </p>
        </div>
        <p className={styles.photoCredit}>
          Photo: El Pantera /{' '}
          <a href="https://commons.wikimedia.org/wiki/File:ValdiviaJerez55.jpg"
            target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>{' '}
          · CC BY-SA 3.0
        </p>
      </div>

      {/* ── The Solera System ── */}
      <div className={styles.imageSection}>
        <h4 className={styles.sectionTitle}>The Solera System</h4>
        <div className={styles.soleraLayout}>
          <div className={styles.soleraLeft}>
            <img
              src="/sherry_solera.jpg"
              alt="Rows of sherry barrels stacked in a traditional bodega showing the solera aging system"
              className={styles.soleraPhoto}
            />
            <p className={styles.photoCredit}>
              Photo: Falkue /{' '}
              <a href="https://commons.wikimedia.org/wiki/File:Sherry_cellar,_Solera_system_2,_2003.jpg"
                target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>{' '}
              · CC BY-SA 3.0
            </p>
          </div>
          <div className={styles.soleraRight}>
            <div className={styles.tierDiagram}>
              {SOLERA_TIERS.map(tier => (
                <div key={tier.key} className={`${styles.tier} ${styles[tier.key]}`}>
                  <span className={styles.tierLabel}>{tier.label}</span>
                  <span className={styles.tierSub}>{tier.sub}</span>
                </div>
              ))}
              <div className={styles.tierArrow}>↓ wine bottled from Solera</div>
            </div>
          </div>
        </div>
        <div className={styles.diagramAndText}>
          <p className={styles.sectionText}>
            The Solera system is a continuous fractional blending method used to age sherry
            consistently over time. Barrels are stacked in rows called <strong>criaderas</strong>{' '}
            (nurseries), with the oldest wine at the bottom — the <strong>Solera</strong> — and
            progressively younger wine in each row above. When wine is extracted from the Solera
            for bottling, each row is partially refilled from the row above it, and the topmost
            criadera is refreshed with the newest wine. This ensures every bottle contains a
            blend of many vintages, giving sherry its remarkable consistency of character.
          </p>
          <div className={styles.diagramWrap}>
            <SoleraDiagram />
          </div>
        </div>
      </div>
    </div>
  );
}
