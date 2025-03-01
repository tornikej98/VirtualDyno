import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<string | null>(null);

  // State variables
  const [cv, setCv] = useState('');
  const [kg, setKg] = useState('');
  const [efficienza, setEfficienza] = useState('0.85');
  const [densitaAria, setDensitaAria] = useState('1.225');
  const [cd, setCd] = useState('0.30');
  const [cr, setCr] = useState('0.015');
  const [areaFrontale, setAreaFrontale] = useState('');
  const [trazione, setTrazione] = useState('FWD');
  const [result, setResult] = useState({ time0to100: '' });
  const [graphData, setGraphData] = useState([]);
  const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');

  const requiredFieldsFilled = cv && kg && areaFrontale;
  const buttonStyle = requiredFieldsFilled ? styles.buttonWhite : styles.buttonDisabled;

  const { colorScheme, toggleTheme } = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  // Help messages translations
  const helpMessages = {
    cv: t('help_cv'),
    kg: t('help_kg'),
    efficienza: t('help_efficienza'),
    densitaAria: t('help_densitaAria'),
    cd: t('help_cd'),
    cr: t('help_cr'),
    areaFrontale: t('help_areaFrontale'),
    trazione: t('help_trazione'),
  };

  const dynamicStyles = {
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.background,
    } as ViewStyle,
    text: {
      color: currentTheme.text,
    } as TextStyle,
    label: {
      paddingBottom: 10,
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.text,
    } as TextStyle,
    input: {
      fontSize: 16,
      height: 45,
      borderColor: '#004aad',
      borderWidth: 1,
      borderRadius: 6,
      paddingLeft: 10,
      color: currentTheme.text,
    },
    expoIcon: {
      color: currentTheme.tabIconSelected,
    },
    additionalOutput: {
      marginTop: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      backgroundColor: currentTheme.background,
      marginBottom: 20,
    },
    outputText: {
      fontSize: 16,
      marginBottom: 5,
      color: currentTheme.text,
    },
    resultText: {
      fontSize: 18,
      marginTop: 20,
      color: currentTheme.text,
    },
    languageText: {
      color: currentTheme.text,
    }
  };

  const handleLanguageToggle = () => {
    const newLang = isEnglish ? 'it' : 'en';
    i18n.changeLanguage(newLang);
    setIsEnglish(!isEnglish);
  };

  const calculateAccelerationTime = (targetSpeed: number) => {
    const powerCV = parseFloat(cv);
    const mass = parseFloat(kg);
    const eta = parseFloat(efficienza);
    const rho = parseFloat(densitaAria);
    const cdValue = parseFloat(cd);
    const crValue = parseFloat(cr);
    const area = parseFloat(areaFrontale);

    const vFinal = targetSpeed === 100 ? 27.78 : targetSpeed / 3.6;
    const powerW = powerCV * 735.5;
    const powerEff = powerW * eta;
    const fAero = 0.5 * rho * cdValue * area * Math.pow(vFinal, 2);
    const fRoll = crValue * mass * 9.81;
    const fNet = powerEff / vFinal - (fAero + fRoll);
    const acceleration = fNet / mass;
    let time = vFinal / acceleration;

    let trazionePenalty = 0;
    if (trazione === 'RWD') {
      trazionePenalty = (0.3 * targetSpeed) / 100;
    } else if (trazione === 'AWD') {
      trazionePenalty = (0.5 * targetSpeed) / 100;
    }

    time = Math.max(time - trazionePenalty, 0);
    return time.toFixed(2);
  };

  const handleCalculate = () => {
    if (!requiredFieldsFilled) {
      setShowError(true);
      return;
    }
    setShowError(false);
    
    const time0to100 = calculateAccelerationTime(100);
    setResult({ time0to100 });

    const data = [];
    for (let speed = 0; speed <= 100; speed += 1) {
      const time = calculateAccelerationTime(speed);
      if (!isNaN(time)) {
        data.push({ speed, time: parseFloat(time) });
      }
    }

    if (data[0].speed !== 0) {
      data.unshift({ speed: 0, time: 0 });
    }

    setGraphData(data);

    setTimeout(() => {
      ref.current?.scrollToEnd();
    }, 100);
  };

  const handleReset = () => {
    setCv('');
    setKg('');
    setEfficienza('0.85');
    setDensitaAria('1.225');
    setCd('0.30');
    setCr('0.015');
    setAreaFrontale('');
    setResult({ time0to100: '' });
    setGraphData([]);
  };

  const renderInputField = (
    labelKey: string,
    state: string,
    setter: (value: string) => void,
    helpKey: string
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <TouchableOpacity onPress={() => setSelectedHelp(selectedHelp === helpKey ? null : helpKey)}>
          <Feather name="help-circle" size={16} color={currentTheme.text} style={styles.helpIcon} />
        </TouchableOpacity>
        <Text style={dynamicStyles.label}> {t(labelKey)}</Text>
      </View>
      <TextInput
        style={dynamicStyles.input}
        keyboardType="numeric"
        value={state}
        onChangeText={setter}
        placeholder={t(`${labelKey}_placeholder`)}
        placeholderTextColor={currentTheme.placeHolderColor}
      />
      {selectedHelp === helpKey && <Text style={styles.helpText}>{helpMessages[helpKey]}</Text>}
    </View>
  );

  const ref = useRef<ScrollView>(null);

  return (
    <ScrollView ref={ref} contentContainerStyle={dynamicStyles.container}>
      <View style={styles.headerContainer}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.languageContainer}>
          <Text style={dynamicStyles.languageText}>IT</Text>
          <Switch
            value={isEnglish}
            onValueChange={handleLanguageToggle}
          />
          <Text style={dynamicStyles.languageText}>EN</Text>
        </View>

        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Feather
            name={colorScheme === 'dark' ? 'moon' : 'sun'}
            size={32}
            color={dynamicStyles.expoIcon.color}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputsWrapper}>
        {renderInputField('cv', cv, setCv, 'cv')}
        {renderInputField('kg', kg, setKg, 'kg')}
        {renderInputField('efficienza', efficienza, setEfficienza, 'efficienza')}
        {renderInputField('densitaAria', densitaAria, setDensitaAria, 'densitaAria')}
        {renderInputField('cd', cd, setCd, 'cd')}
        {renderInputField('cr', cr, setCr, 'cr')}
        {renderInputField('areaFrontale', areaFrontale, setAreaFrontale, 'areaFrontale')}

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={dynamicStyles.label}>{t('trazione')}</Text>
            <TouchableOpacity onPress={() => setSelectedHelp(selectedHelp === 'trazione' ? null : 'trazione')}>
              <Feather name="help-circle" size={16} color={currentTheme.text} style={styles.helpIcon} />
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={trazione}
            onValueChange={setTrazione}
            dropdownIconColor={currentTheme.text}
          >
            {['FWD', 'RWD', 'AWD'].map((type) => (
              <Picker.Item
                key={type}
                label={t(type.toLowerCase())}
                value={type}
                color={dynamicStyles.text.color as string}
              />
            ))}
          </Picker>
          {selectedHelp === 'trazione' && <Text style={styles.helpText}>{helpMessages.trazione}</Text>}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={handleCalculate}
            disabled={!requiredFieldsFilled}
          >
            <Text style={{ color: !requiredFieldsFilled ? '#999' : '#000' }}>{t('calcola')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <Text style={styles.resetButtonText}>{t('reset')}</Text>
          </TouchableOpacity>
        </View>

        {showError && <Text style={styles.errorText}>{t('error_fields')}</Text>}

        {result.time0to100 && (
          <Text style={dynamicStyles.resultText}>
            {t('tempo')} {result.time0to100} {t('seconds')}
          </Text>
        )}

        {graphData.length > 0 && (
          <View>
            <LineChart
              data={{
                labels: graphData
                  .filter((d, index) => index % 10 === 0)
                  .map((d) => `${d.speed}`),
                datasets: [{ data: graphData.map((d) => d.time) }],
              }}
              width={320}
              height={240}
              yAxisSuffix=' s'
              chartConfig={{
                backgroundColor: currentTheme.background,
                backgroundGradientFrom: currentTheme.background,
                backgroundGradientTo: currentTheme.background,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 74, 173, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 74, 173, ${opacity})`,
                propsForDots: {
                  r: '0.1',
                  strokeWidth: '2',
                  stroke: currentTheme.text,
                },
                style: {
                  paddingTop: '5%',
                  paddingBottom: '5%',
                },
              }}
              bezier
              style={styles.chart}
              fromZero
            />
          </View>
        )}

        {result.time0to100 && (
          <View style={dynamicStyles.additionalOutput}>
            <Text style={dynamicStyles.outputText}>
              {t('power_kgcv')}: {(kg / cv).toFixed(2)} CV/Kg
            </Text>
            <Text style={dynamicStyles.outputText}>
              {t('power')}: {(cv / (kg / 1000)).toFixed(2)} CV/t
            </Text>
            <Text style={dynamicStyles.outputText}>
              {t('acceleration')}:{' '}
              {(27.78 / parseFloat(result.time0to100)).toFixed(2)} m/s²
            </Text>
            <Text style={dynamicStyles.outputText}>
              {t('distance')}:{' '}
              {(
                0.5 *
                (27.78 / parseFloat(result.time0to100)) *
                Math.pow(parseFloat(result.time0to100), 2)
              ).toFixed(2)}{' '}
              meters
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#004aad',
  },
  controlsContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 10,
  },
  languageContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  themeToggle: {
    marginLeft: 200,
    color: '#004aad',
    borderRadius: 100,
    padding: 5,
    borderColor: 'white'
  },
  inputsWrapper: {
    width: '90%',
    marginTop: 10
  },
  inputGroup: {
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  helpIcon: {
    marginLeft: 5,
    paddingBottom: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonWhite: {
    backgroundColor: 'white',
    padding: 10,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    flex: 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    flex: 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#004aad',
    padding: 10,
    height: 45,
    borderRadius: 50,
    flex: 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: 'white',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 15,
    color: '#004aad',
  },
  chart: {
    marginVertical: 15,
    borderRadius: 8,
  },
  additionalOutput: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  outputText: {
    fontSize: 16,
    marginBottom: 5,
  },
});