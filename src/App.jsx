import { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Card,
  Form,
  Upload,
  Input,
  InputNumber,
  Checkbox,
  Button,
  message,
  Divider,
  Tooltip,
  Splitter,
} from "antd";
import {
  InboxOutlined,
  ScissorOutlined,
  InfoCircleOutlined,
  HeartFilled,
  FilePdfOutlined,
} from "@ant-design/icons";
import "./App.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // 🔹 PDF önizleme URL'si
  const [loading, setLoading] = useState(false);

  // file değiştiğinde preview URL üret / temizle
  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = async (values) => {
    const { headerTexts, bandMm, marginMm, ignoreCase } = values;

    if (!file) {
      message.error("Lütfen bir PDF dosyası seç.");
      return;
    }

    if (!headerTexts || !headerTexts.trim()) {
      message.error("Lütfen en az bir header metni gir.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("header_texts", headerTexts);
      formData.append("band_mm", bandMm);
      formData.append("margin_mm", marginMm);
      formData.append("ignore_case", ignoreCase || false);

      const res = await fetch(
        "https://pdf-header-api.onrender.com/remove-headers",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        let msg = "İstek başarısız.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // json okunamazsa boşver
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "_noheaders.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      message.success("PDF başarıyla işlendi ve indirildi.");
    } catch (err) {
      message.error(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: "file",
    multiple: false,
    accept: "application/pdf",
    beforeUpload: (file) => {
      setFile(file);     // 🔹 state'e yaz
      return false;      // otomatik upload yapma
    },
    onRemove: () => {
      setFile(null);     // 🔹 kaldırınca preview da temizlenecek
    },
    maxCount: 1,
    fileList: file ? [file] : [],
  };

  return (
    <Layout className="layout">
      <Header className="app-header">
        <div className="header-inner">
          <div className="logo-mark">
            <ScissorOutlined />
          </div>
          <div className="logo-text">
            <span className="logo-title">PDF Header Remover</span>
            <span className="logo-sub">clean up noisy exports in one click</span>
          </div>
        </div>
      </Header>

      <Content className="app-content">
        <div className="content-shell">
          <Splitter
            className="content-splitter"
            resizeTrigger={true}
            min="25%"
            max="65%"
            defaultSize="40%"
          >
            {/* Sol panel: Form */}
            <Splitter.Panel>
              <div className="left-pane">
                <Card className="app-card">
                  <div className="card-header">
                    <div className="card-title-area">
                      <div>
                        <span className="merve-text">
                          Sadece Merve için geliştirilmiştir <HeartFilled />
                        </span>
                        <Title level={4} style={{ marginBottom: 2 }}>
                          PDF Dosyasını Yükle ve Temizle
                        </Title>
                        <Text type="secondary">
                          Üst bant yüksekliğini ve header metinlerini belirle
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <Form
                    layout="vertical"
                    onFinish={handleFinish}
                    initialValues={{
                      bandMm: 25,
                      marginMm: 0,
                      ignoreCase: false,
                    }}
                  >
                    <Form.Item label="PDF Dosyası">
                      <Dragger {...uploadProps} className="upload-area">
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                          PDF dosyasını buraya sürükle veya tıklayıp seç
                        </p>
                        <p className="ant-upload-hint">
                          Büyük dosyalar için işleme süresi birkaç saniye
                          sürebilir.
                        </p>
                      </Dragger>
                    </Form.Item>

                    <Form.Item
                      label={
                        <div className="label-with-hint">
                          <span>Header Metinleri</span>
                          <Tooltip title="Her satıra PDF üzerinde aynen görünen bir metin yaz. Örn: firma adı, tarih, sayfa numarası cümlesi.">
                            <InfoCircleOutlined className="label-icon" />
                          </Tooltip>
                        </div>
                      }
                      name="headerTexts"
                      rules={[
                        {
                          required: true,
                          message: "Lütfen en az bir header metni gir.",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder={`Örnek:\nFirma Adı\nCONFIDENTIAL\nSayfa`}
                      />
                    </Form.Item>

                    <div className="inline-row">
                      <Form.Item
                        label="Üst Bant (mm)"
                        name="bandMm"
                        className="inline-item"
                      >
                        <InputNumber
                          min={5}
                          max={120}
                          style={{ width: "100%" }}
                          addonAfter="mm"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Sol/Sağ Margin (mm)"
                        name="marginMm"
                        className="inline-item"
                      >
                        <InputNumber
                          min={0}
                          max={40}
                          style={{ width: "100%" }}
                          addonAfter="mm"
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      name="ignoreCase"
                      valuePropName="checked"
                      className="checkbox-item"
                    >
                      <Checkbox>Büyük/küçük harfe duyarsız ara</Checkbox>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={loading}
                        icon={<ScissorOutlined />}
                      >
                        {loading ? "İşleniyor..." : "Headerları Sil ve PDF İndir"}
                      </Button>
                    </Form.Item>
                  </Form>

                  <div className="hint-box">
                    <Text strong>İpucu:</Text>{" "}
                    <Text type="secondary">
                      Eğer bazı headerlar silinmiyorsa, tam metni PDF üzerinde
                      göründüğü gibi (boşluklar ve noktalama dahil) yazmayı dene.
                    </Text>
                  </div>
                </Card>
              </div>
            </Splitter.Panel>

            {/* Sağ panel: Yüklenen PDF'in önizlemesi */}
            <Splitter.Panel>
              <div className="right-pane">
                {previewUrl ? (
                  <iframe
                    title="PDF Önizleme"
                    src={previewUrl}
                    className="pdf-preview-frame"
                  />
                ) : (
                  <div className="right-inner">
                    <div className="preview-icon-wrap">
                      <FilePdfOutlined className="preview-icon" />
                    </div>
                    <Title level={3} className="right-title">
                      Yakında burada önizleme olacak
                    </Title>
                    <Text type="secondary" className="right-text">
                      Henüz bir PDF seçmedin. PDF yüklediğinde sağ tarafta
                      anında önizlemesini göreceksin.
                    </Text>
                  </div>
                )}
              </div>
            </Splitter.Panel>
          </Splitter>
        </div>
      </Content>

      <Footer className="app-footer">
        <Text type="secondary">
          <span className="pill">ygz</span>
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;
