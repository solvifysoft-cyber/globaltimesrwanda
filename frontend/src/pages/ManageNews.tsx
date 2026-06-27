import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNews } from "@/contexts/NewsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedArticleFields } from "@/lib/localization";
import { normalizeImageUrl } from "@/lib/image-utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Save, Trash2, Edit, Upload, Languages, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { uploadAPI } from "@/lib/api";

const ManageNews = () => {
  const navigate = useNavigate();
  const { articles, addArticle, updateArticle, deleteArticle } = useNews();
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState({
    titleEN: "",
    titleRW: "",
    titleFR: "",
    excerptEN: "",
    excerptRW: "",
    excerptFR: "",
    contentEN: "",
    contentRW: "",
    contentFR: "",
    category: "Politics",
    image: "",
    images: [] as string[],
    videos: [] as string[],
    video: "",
    imageCaptions: {} as Record<string, { EN?: string; RW?: string; FR?: string }>,
    author: "Admin",
    featured: false,
    trending: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<'EN' | 'RW' | 'FR'>('EN');
  const [activeLanguageTab, setActiveLanguageTab] = useState<'EN' | 'RW' | 'FR'>('EN');
  const [targetLanguage, setTargetLanguage] = useState<'EN' | 'RW' | 'FR'>('RW');
  const [isTranslating, setIsTranslating] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const insertVideoInputRef = useRef<HTMLInputElement>(null);
  const [insertTargetLanguage, setInsertTargetLanguage] = useState<'EN' | 'RW' | 'FR' | null>(null);
  const [insertType, setInsertType] = useState<'image' | 'video' | null>(null);
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [captionInputs, setCaptionInputs] = useState({ EN: "", RW: "", FR: "" });

  const languageLabels: Record<'EN' | 'RW' | 'FR', string> = {
    EN: "English",
    RW: "Kinyarwanda",
    FR: "French",
  };

  const languageCodes: Record<'EN' | 'RW' | 'FR', string> = {
    EN: "en",
    RW: "rw",
    FR: "fr",
  };

  const availableTargetLanguages = useMemo(
    () => (["EN", "RW", "FR"] as Array<'EN' | 'RW' | 'FR'>).filter((lang) => lang !== primaryLanguage),
    [primaryLanguage]
  );

  useEffect(() => {
    if (targetLanguage === primaryLanguage) {
      setTargetLanguage(availableTargetLanguages[0]);
    }
  }, [primaryLanguage, targetLanguage, availableTargetLanguages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      const valid: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`Invalid file ${file.name}. Only images allowed.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} exceeds 5MB`);
          continue;
        }
        valid.push(file);
      }
      setSelectedImageFiles(valid);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error("Please select a valid video file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Video size must be less than 20MB");
        return;
      }
      setSelectedVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = formData.image;
      let videoUrl = formData.video;
      let galleryUrls = formData.images ?? [];
      let videosArr = formData.videos ?? [];

      // When updating an article with new images, REPLACE the old images instead of appending
      if (selectedImageFiles && selectedImageFiles.length > 0) {
        const uploadedMany = await uploadAPI.uploadFiles(selectedImageFiles);
        const urls = uploadedMany.map(u => u.url);
        // REPLACE existing images with the newly uploaded ones
        galleryUrls = urls;
        imageUrl = urls[0]; // Set the first uploaded image as the featured image
      }

      // When updating an article with a new video, REPLACE the old video instead of appending
      if (selectedVideoFile) {
        const uploaded = await uploadAPI.uploadFile(selectedVideoFile);
        videoUrl = uploaded.url;
        // REPLACE existing videos with the newly uploaded one
        videosArr = [uploaded.url];
      }
      
      const article = {
        id: editingId ?? 0,
        slug: '',   // backend generates the real slug; this is just a placeholder
        title: { EN: formData.titleEN, RW: formData.titleRW, FR: formData.titleFR },
        excerpt: { EN: formData.excerptEN, RW: formData.excerptRW, FR: formData.excerptFR },
        content: { EN: formData.contentEN, RW: formData.contentRW, FR: formData.contentFR },
        category: formData.category,
        image: imageUrl,
        images: galleryUrls,
        videos: videosArr,
        video: videoUrl,
        imageCaptions: formData.imageCaptions || {},
        date: new Date().toISOString(),
        author: formData.author,
        featured: formData.featured,
        trending: formData.trending,
      };

      console.log('ManageNews: Saving article with imageCaptions:', article.imageCaptions);
      console.log('ManageNews: ImageCaptions keys:', Object.keys(article.imageCaptions || {}));

      if (editingId !== null) {
        await updateArticle(editingId, article);
        toast.success("Article updated successfully");
      } else {
        await addArticle(article);
        toast.success("Article added successfully");
      }

      resetForm();
    } catch (error) {
      toast.error("Error saving article");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titleEN: "", titleRW: "", titleFR: "",
      excerptEN: "", excerptRW: "", excerptFR: "",
      contentEN: "", contentRW: "", contentFR: "",
      category: "Politics", image: "", images: [], videos: [], video: "", imageCaptions: {}, author: "Admin", featured: false, trending: false
    });
    setEditingId(null);
    setSelectedImageFiles([]);
    setSelectedVideoFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleEdit = (id: number) => {
    const article = articles.find(a => a.id === id);
    if (article) {
      // Normalize image caption keys to ensure consistent matching
      const normalizedCaptions: Record<string, { EN?: string; RW?: string; FR?: string }> = {};
      if (article.imageCaptions) {
        Object.entries(article.imageCaptions).forEach(([url, captions]) => {
          const normalizedUrl = normalizeImageUrl(url);
          normalizedCaptions[normalizedUrl] = captions;
        });
      }
      
      setFormData({
        titleEN: article.title.EN,
        titleRW: article.title.RW,
        titleFR: article.title.FR,
        excerptEN: article.excerpt.EN,
        excerptRW: article.excerpt.RW,
        excerptFR: article.excerpt.FR,
        contentEN: article.content.EN,
        contentRW: article.content.RW,
        contentFR: article.content.FR,
      category: article.category,
      image: article.image || "",
      images: article.images || [],
      videos: article.videos || [],
      video: article.video || "",
      imageCaptions: normalizedCaptions,
      author: article.author,
      featured: article.featured || false,
      trending: article.trending || false
    });
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle(id);
      toast.success("Article deleted successfully");
    }
  };

  const translateText = async (text: string, source: 'EN' | 'RW' | 'FR', target: 'EN' | 'RW' | 'FR') => {
    if (!text?.trim()) return "";
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${languageCodes[source]}&tl=${languageCodes[target]}&dt=t&q=${encodeURIComponent(
        text,
      )}`,
    );
    if (!response.ok) {
      throw new Error("Translation service failed");
    }
    const data = await response.json();
    return (data?.[0]?.map((item: any[]) => item[0]).join("")) || text;
  };

  const handleTranslate = async () => {
    if (primaryLanguage === targetLanguage) {
      toast.error("Primary and target languages must be different");
      return;
    }

    setIsTranslating(true);
    try {
      const updatedData = { ...formData };
      for (const field of ["title", "excerpt", "content"] as const) {
        const key = `${field}${primaryLanguage}` as keyof typeof formData;
        const targetKey = `${field}${targetLanguage}` as keyof typeof formData;
        const sourceValue = formData[key] as string;
        if (sourceValue) {
          const translated = await translateText(sourceValue, primaryLanguage, targetLanguage);
          updatedData[targetKey] = translated;
        }
      }
      setFormData(updatedData);
      toast.success(`Translated ${languageLabels[primaryLanguage]} content to ${languageLabels[targetLanguage]}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to translate content right now. Please try again later.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/admin")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
          </Button>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                {editingId ? "Edit Article" : "Add New Article"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg lg:flex-row lg:items-center">
                  <Label>Primary Language:</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["EN", "RW", "FR"] as Array<'EN' | 'RW' | 'FR'>).map((lang) => (
                      <Button
                        key={lang}
                        type="button"
                        variant={primaryLanguage === lang ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setPrimaryLanguage(lang);
                          setActiveLanguageTab(lang);
                        }}
                      >
                        {languageLabels[lang]}
                      </Button>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Write in {languageLabels[primaryLanguage]} first, then translate into other languages.
                  </div>
                </div>

                <Tabs value={activeLanguageTab} onValueChange={(value) => setActiveLanguageTab(value as 'EN' | 'RW' | 'FR')} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="EN">English</TabsTrigger>
                    <TabsTrigger value="RW">Kinyarwanda</TabsTrigger>
                    <TabsTrigger value="FR">French</TabsTrigger>
                  </TabsList>

                  <TabsContent value="EN" className="space-y-4 mt-4">
                    <div>
                      <Label>Title (English)</Label>
                      <Input value={formData.titleEN} onChange={(e) => setFormData({...formData, titleEN: e.target.value})} required placeholder="Enter title in English" />
                    </div>
                    <div>
                      <Label>Excerpt (English)</Label>
                      <Textarea value={formData.excerptEN} onChange={(e) => setFormData({...formData, excerptEN: e.target.value})} required placeholder="Enter excerpt in English" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('EN'); setInsertType('image'); insertImageInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Insert Image
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('EN'); setInsertType('video'); insertVideoInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Insert Video
                        </Button>
                      </div>
                      <Textarea value={formData.contentEN} onChange={(e) => setFormData({...formData, contentEN: e.target.value})} rows={8} required placeholder="Enter full content in English (HTML supported)" />
                    </div>
                  </TabsContent>

                  <TabsContent value="RW" className="space-y-4 mt-4">
                    <div>
                      <Label>Title (Kinyarwanda)</Label>
                      <Input value={formData.titleRW} onChange={(e) => setFormData({...formData, titleRW: e.target.value})} required placeholder="Andika umutwe mu Kinyarwanda" />
                    </div>
                    <div>
                      <Label>Excerpt (Kinyarwanda)</Label>
                      <Textarea value={formData.excerptRW} onChange={(e) => setFormData({...formData, excerptRW: e.target.value})} required placeholder="Andika incamake mu Kinyarwanda" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('RW'); setInsertType('image'); insertImageInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Shyiramo Ifoto
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('RW'); setInsertType('video'); insertVideoInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Shyiramo Video
                        </Button>
                      </div>
                      <Textarea value={formData.contentRW} onChange={(e) => setFormData({...formData, contentRW: e.target.value})} rows={8} required placeholder="Andika inyandiko yuzuye mu Kinyarwanda (HTML biremewe)" />
                    </div>
                  </TabsContent>

                  <TabsContent value="FR" className="space-y-4 mt-4">
                    <div>
                      <Label>Title (French)</Label>
                      <Input value={formData.titleFR} onChange={(e) => setFormData({...formData, titleFR: e.target.value})} required placeholder="Entrez le titre en français" />
                    </div>
                    <div>
                      <Label>Excerpt (French)</Label>
                      <Textarea value={formData.excerptFR} onChange={(e) => setFormData({...formData, excerptFR: e.target.value})} required placeholder="Entrez l'extrait en français" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('FR'); setInsertType('image'); insertImageInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Insérer une image
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => { setInsertTargetLanguage('FR'); setInsertType('video'); insertVideoInputRef.current?.click(); }}>
                          <Upload className="h-4 w-4 mr-1" /> Insérer une vidéo
                        </Button>
                      </div>
                      <Textarea value={formData.contentFR} onChange={(e) => setFormData({...formData, contentFR: e.target.value})} rows={8} required placeholder="Entrez le contenu complet en français (HTML pris en charge)" />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Article Details</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Politics">Politics</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Economics">Economics</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Story">Story</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Author</Label>
                      <Input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Featured Image</Label>
                      <Input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} />
                      {selectedImageFiles.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Selected: {selectedImageFiles.map(f => f.name).join(', ')}</p>
                      )}
                      {formData.image && selectedImageFiles.length === 0 && <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />}
                      {formData.images && formData.images.length > 0 && (
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {formData.images.map((url, idx) => (
                            <img key={idx} src={url} className="h-16 w-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Video (Optional)</Label>
                      <Input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} />
                      {selectedVideoFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedVideoFile.name}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="featured" checked={formData.featured} onCheckedChange={(checked) => setFormData({...formData, featured: checked as boolean})} />
                    <Label htmlFor="featured">Featured Article</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="trending" checked={formData.trending} onCheckedChange={(checked) => setFormData({...formData, trending: checked as boolean})} />
                    <Label htmlFor="trending">Show in Trending Now</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isUploading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isUploading ? "Saving..." : editingId ? "Update Article" : "Add Article"}
                  </Button>
                  {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Auto-translation requires a backend service. For now, please manually translate your content into the other two languages.
                  </p>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Translate into:</Label>
                      <Select value={targetLanguage} onValueChange={(value) => setTargetLanguage(value as 'EN' | 'RW' | 'FR')}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["EN", "RW", "FR"] as Array<'EN' | 'RW' | 'FR'>)
                            .filter((lang) => lang !== primaryLanguage)
                            .map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {languageLabels[lang]}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={handleTranslate} disabled={isTranslating}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {isTranslating ? "Translating..." : `Translate from ${languageLabels[primaryLanguage]}`}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When you run translation, the Title, Excerpt, and Content fields for {languageLabels[targetLanguage]} will be updated with the translated text. Review and adjust the wording if needed.
                  </p>
                </div>
              <input ref={insertImageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !insertTargetLanguage) return;
                try {
                  setIsUploading(true);
                  const uploaded = await uploadAPI.uploadFile(file);
                  // Store the uploaded URL and open caption dialog
                  setPendingImageUrl(uploaded.url);
                  setCaptionInputs({ EN: "", RW: "", FR: "" });
                  setCaptionDialogOpen(true);
                } catch {
                  toast.error('Failed to upload image');
                } finally {
                  setIsUploading(false);
                  if (insertImageInputRef.current) insertImageInputRef.current.value = '';
                }
              }} />
              <input ref={insertVideoInputRef} type="file" accept="video/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !insertTargetLanguage) return;
                try {
                  setIsUploading(true);
                  const uploaded = await uploadAPI.uploadFile(file);
                  const tag = `<video controls src="${uploaded.url}"></video>`;
                  if (insertTargetLanguage === 'EN') setFormData(prev => ({ ...prev, contentEN: `${prev.contentEN}\n${tag}` }));
                  if (insertTargetLanguage === 'RW') setFormData(prev => ({ ...prev, contentRW: `${prev.contentRW}\n${tag}` }));
                  if (insertTargetLanguage === 'FR') setFormData(prev => ({ ...prev, contentFR: `${prev.contentFR}\n${tag}` }));
                  setFormData(prev => ({ ...prev, videos: [...(prev.videos || []), uploaded.url] }));
                  toast.success('Video inserted into content');
                } catch {
                  toast.error('Failed to upload video');
                } finally {
                  setIsUploading(false);
                  if (insertVideoInputRef.current) insertVideoInputRef.current.value = '';
                  setInsertTargetLanguage(null);
                  setInsertType(null);
                }
              }} />
              </form>
            </CardContent>
          </Card>

          {/* Caption Dialog */}
          <Dialog open={captionDialogOpen} onOpenChange={setCaptionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Image Caption</DialogTitle>
                <DialogDescription>
                  Enter captions for this image in all three languages. Captions will be displayed below the image.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>English Caption</Label>
                  <Input
                    value={captionInputs.EN}
                    onChange={(e) => setCaptionInputs(prev => ({ ...prev, EN: e.target.value }))}
                    placeholder="Enter caption in English"
                  />
                </div>
                <div>
                  <Label>Kinyarwanda Caption</Label>
                  <Input
                    value={captionInputs.RW}
                    onChange={(e) => setCaptionInputs(prev => ({ ...prev, RW: e.target.value }))}
                    placeholder="Andika caption mu Kinyarwanda"
                  />
                </div>
                <div>
                  <Label>French Caption</Label>
                  <Input
                    value={captionInputs.FR}
                    onChange={(e) => setCaptionInputs(prev => ({ ...prev, FR: e.target.value }))}
                    placeholder="Entrez la légende en français"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setCaptionDialogOpen(false);
                  setPendingImageUrl(null);
                  setCaptionInputs({ EN: "", RW: "", FR: "" });
                  setInsertTargetLanguage(null);
                  setInsertType(null);
                }}>
                  Skip
                </Button>
                <Button onClick={() => {
                  if (!pendingImageUrl || !insertTargetLanguage) return;
                  
                  // Normalize the URL to ensure consistent key matching
                  const normalizedUrl = normalizeImageUrl(pendingImageUrl);
                  
                  // Store captions
                  const captions: { EN?: string; RW?: string; FR?: string } = {};
                  if (captionInputs.EN.trim()) captions.EN = captionInputs.EN.trim();
                  if (captionInputs.RW.trim()) captions.RW = captionInputs.RW.trim();
                  if (captionInputs.FR.trim()) captions.FR = captionInputs.FR.trim();
                  
                  if (Object.keys(captions).length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      imageCaptions: {
                        ...prev.imageCaptions,
                        [normalizedUrl]: captions
                      }
                    }));
                  }
                  
                  // Insert image tag with normalized URL for consistency
                  const tag = `<img src="${normalizedUrl}" alt="" />`;
                  if (insertTargetLanguage === 'EN') {
                    setFormData(prev => ({ ...prev, contentEN: `${prev.contentEN}\n${tag}` }));
                  }
                  if (insertTargetLanguage === 'RW') {
                    setFormData(prev => ({ ...prev, contentRW: `${prev.contentRW}\n${tag}` }));
                  }
                  if (insertTargetLanguage === 'FR') {
                    setFormData(prev => ({ ...prev, contentFR: `${prev.contentFR}\n${tag}` }));
                  }
                  
                  toast.success('Image inserted into content');
                  setCaptionDialogOpen(false);
                  setPendingImageUrl(null);
                  setCaptionInputs({ EN: "", RW: "", FR: "" });
                  setInsertTargetLanguage(null);
                  setInsertType(null);
                }}>
                  Insert Image
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle>All Articles ({articles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articles.map(article => {
                  const localized = getLocalizedArticleFields(article, language);
                  return (
                  <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{localized.title}</h3>
                      <p className="text-sm text-muted-foreground">{article.category} • {new Date(article.date).toLocaleDateString()} • by {article.author}</p>
                      {article.featured && <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded mt-1 inline-block">Featured</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(article.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
                {articles.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No articles yet. Add your first article above.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageNews;
