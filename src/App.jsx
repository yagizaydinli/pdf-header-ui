import { useState } from "react";
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
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./App.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

      const res = await fetch("http://localhost:8000/remove-headers", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = "İstek başarısız.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // json parse olmazsa geç
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
      setFile(file);
      return false; // otomatik upload yapma
    },
    onRemove: () => {
      setFile(null);
    },
    maxCount: 1,
    fileList: file ? [file] : [],
  };

  return (
    <Layout className="layout">
      <Header className="app-header">
        <div className="logo">PDF Header Remover</div>
      </Header>

      <Content className="app-content">
        <Card className="app-card" bordered>
          <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
            PDF Header Temizleme Aracı
          </Title>
          <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
            PDF yükle, üstteki header metinlerini kaldır ve yeni PDF&apos;i indir.
          </Text>

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
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  PDF dosyasını buraya sürükle veya tıklayıp seç
                </p>
                <p className="ant-upload-hint">
                  Sadece tek bir PDF dosyası yüklenebilir.
                </p>
              </Dragger>
            </Form.Item>

            <Form.Item
              label={
                <>
                  Header Metinleri{" "}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (Her satıra bir metin yaz)
                  </Text>
                </>
              }
              name="headerTexts"
              rules={[
                { required: true, message: "Lütfen en az bir header metni gir." },
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
                <InputNumber min={5} max={120} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Sol/Sağ Margin (mm)"
                name="marginMm"
                className="inline-item"
              >
                <InputNumber min={0} max={40} style={{ width: "100%" }} />
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
              >
                {loading ? "İşleniyor..." : "Headerları Sil ve PDF İndir"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>

      <Footer className="app-footer">
        <Text type="secondary">Local API: http://localhost:8000/remove-headers</Text>
      </Footer>
    </Layout>
  );
}

export default App;
